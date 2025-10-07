<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use App\Jobs\ExpireCartJob;
use App\Jobs\ExpireCheckoutJob;
use App\Jobs\SyncStockJob;
use App\Http\Controllers\Api\PaymentWebhookController;

class CheckoutController extends Controller
{
    /**
     * ✅ Adiciona item ao carrinho com expiração automática
     */
    public function addToCart(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $sessionId = $data['session_id'];
        $productId = $data['product_id'];
        $quantity = $data['quantity'];

        // Buscar produto
        $product = Product::findOrFail($productId);

        // Verificar estoque disponível
        $currentStock = Redis::get("product_stock_{$productId}") ?? $product->quantity;
        $reservedStock = Redis::get("product_reserved_{$productId}") ?? 0;
        $availableStock = $currentStock - $reservedStock;

        if ($availableStock < $quantity) {
            return response()->json([
                'message' => 'Estoque insuficiente',
                'available_stock' => $availableStock,
                'requested_quantity' => $quantity
            ], 400);
        }

        // Reservar estoque
        Redis::incrby("product_reserved_{$productId}", $quantity);
        // Salvar timestamp da reserva global do produto
        Redis::set("product_reserved_time_{$productId}", time());
        // Salvar reserva individual (para limpeza posterior)
        Redis::setex("reserve:{$sessionId}:{$productId}", 600, $quantity); // 10 min TTL

        // Adicionar ao carrinho acumulando produtos
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);
        $cart = $cartData ? json_decode($cartData, true) : [];

        // Se já existe o produto, soma a quantidade
        if (isset($cart[$productId])) {
            $cart[$productId]['quantity'] += $quantity;
            $cart[$productId]['total_price'] = $cart[$productId]['unit_price'] * $cart[$productId]['quantity'];
        } else {
            $cart[$productId] = [
                'product_id' => $productId,
                'product_name' => $product->name,
                'unit_price' => $product->price,
                'quantity' => $quantity,
                'total_price' => $product->price * $quantity,
                'image_url' => $product->image ? asset('storage/' . $product->image) : null,
                'expires_at' => now()->addMinutes(10)->toISOString()
            ];
        }

        Redis::setex($cartKey, 600, json_encode($cart)); // 10 min TTL
    
        $this->registrarAtualizacaoEstoque($productId, 'stock_change');

        // ✅ DISPARAR JOB DE EXPIRAÇÃO
        try {
            ExpireCartJob::dispatch($sessionId, $productId, $quantity)
                ->delay(now()->addMinutes(10)); // 10 minutos

            Log::info('🛒 Job ExpireCartJob disparado com sucesso', [
                'session_id' => $sessionId,
                'product_id' => $productId,
                'quantity' => $quantity,
                'delay' => '10 minutes',
                'will_expire_at' => now()->addMinutes(10)->format('H:i:s')
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Erro ao disparar ExpireCartJob', [
                'session_id' => $sessionId,
                'product_id' => $productId,
                'error' => $e->getMessage()
            ]);
        }

        // Retornar o item atualizado/adicionado
        $cartItemResponse = $cart[$productId];
    
        // Sincroniza estoque do produto após operação
        Redis::set("product_stock_{$productId}", Product::find($productId)->quantity);
        return response()->json([
            'message' => 'Produto adicionado ao carrinho',
            'cart_item' => $cartItemResponse,
            'available_stock' => $availableStock - $quantity,
            'cart_expires_in_minutes' => 10,
            'debug_job_dispatched' => true
        ], 201);
    }

    /**
     * ✅ Remove item do carrinho
     */
    public function removeFromCart(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'product_id' => 'required|integer'
        ]);

        $sessionId = $data['session_id'];
        $productId = $data['product_id'];
        
        $cartKey = "cart:{$sessionId}";
        $reserveKey = "reserve:{$sessionId}:{$productId}";
        
        // Obter quantidade reservada antes de remover
        $reservedQuantity = Redis::get($reserveKey) ?? 0;
        
        if ($reservedQuantity > 0) {
            // Liberar estoque reservado
            Redis::decrby("product_reserved_{$productId}", $reservedQuantity);
            
            // Garantir que não fique negativo
            $currentReserved = Redis::get("product_reserved_{$productId}") ?? 0;
            if ($currentReserved < 0) {
                Redis::set("product_reserved_{$productId}", 0);
                Redis::set("product_reserved_{$productId}", $quantidade);
                Redis::set("product_reserved_time_{$productId}", time());
            }
        }
        
        // Remover reserva
        Redis::del($reserveKey);
        
        // Atualizar carrinho (removendo o item)
        $cartData = Redis::get($cartKey);
        if ($cartData) {
            $cart = json_decode($cartData, true);
            unset($cart[$productId]);
            
            if (empty($cart)) {
                Redis::del($cartKey);
            } else {
                Redis::setex($cartKey, 600, json_encode($cart));
            }
        }
        $this->registrarAtualizacaoEstoque($productId, 'stock_change');
     
        Redis::set("product_stock_{$productId}", Product::find($productId)->quantity);
        return response()->json([
            'message' => 'Produto removido do carrinho',
            'released_quantity' => $reservedQuantity
        ]);
    }

    /**
     * ✅ Atualiza quantidade no carrinho
     */
    public function updateCart(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'product_id' => 'required|integer',
            'quantity' => 'required|integer|min:1'
        ]);

        $sessionId = $data['session_id'];
        $productId = $data['product_id'];
        $newQuantity = $data['quantity'];
        
        $reserveKey = "reserve:{$sessionId}:{$productId}";
        $oldQuantity = Redis::get($reserveKey) ?? 0;
        $quantityDiff = $newQuantity - $oldQuantity;
        
        // Verificar se há estoque suficiente para o aumento
        $this->registrarAtualizacaoEstoque($productId, 'stock_change');
        if ($quantityDiff > 0) {
            $product = Product::findOrFail($productId);
            $currentStock = Redis::get("product_stock_{$productId}") ?? $product->quantity;
            $reservedStock = Redis::get("product_reserved_{$productId}") ?? 0;
            $availableStock = $currentStock - $reservedStock;
            
            if ($availableStock < $quantityDiff) {
                return response()->json([
                    'message' => 'Estoque insuficiente para aumentar quantidade',
                    'available_stock' => $availableStock,
                    'requested_increase' => $quantityDiff
                ], 400);
            }
        }
        
        // Atualizar reserva
        Redis::incrby("product_reserved_{$productId}", $quantityDiff);
        Redis::setex($reserveKey, 600, $newQuantity);
        
        // Atualizar carrinho
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);
        if ($cartData) {
            $cart = json_decode($cartData, true);
            if (isset($cart[$productId])) {
                $cart[$productId]['quantity'] = $newQuantity;
                $cart[$productId]['total_price'] = $cart[$productId]['unit_price'] * $newQuantity;
                Redis::setex($cartKey, 600, json_encode($cart));
            }
        }

        return response()->json([
            'message' => 'Carrinho atualizado',
            'new_quantity' => $newQuantity,
            'quantity_change' => $quantityDiff
        ]);
    }

    /**
     * ✅ Obter carrinho
     */
    public function getCart($sessionId)
    {
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);
        
        if (!$cartData) {
            // Limpa carrinho e libera estoque se expirado
            $this->clearCart($sessionId);
            return response()->json([
                'message' => 'Seu carrinho expirou! Você tem apenas 10 minutos para escolher seus produtos.'
            ], 410);
        }
        
        $cart = json_decode($cartData, true);
        $total = array_sum(array_column($cart, 'total_price'));
        
        return response()->json([
            'cart' => array_values($cart),
            'total' => $total,
            'items_count' => count($cart)
        ]);
    }

    /**
     * ✅ Limpar carrinho
     */
    public function clearCart($sessionId)
    {
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);
        
        if ($cartData) {
            $cart = json_decode($cartData, true);
            
            // Liberar todas as reservas
            foreach ($cart as $productId => $item) {
                $this->registrarAtualizacaoEstoque($productId, 'stock_change');
                $reserveKey = "reserve:{$sessionId}:{$productId}";
                $reservedQuantity = Redis::get($reserveKey) ?? 0;
                
                if ($reservedQuantity > 0) {
                    Redis::decrby("product_reserved_{$productId}", $reservedQuantity);
                    Redis::del($reserveKey);
                }
            }
        }
        
        // Remover carrinho
        Redis::del($cartKey);
        
        return response()->json(['message' => 'Carrinho limpo']);
    }

    /**
     * ✅ Obter estoque de todos os produtos
     */
    public function getAllProductsStock()
    {
        $products = Product::where('is_active', true)->get();
        $productsWithStock = [];

        // Removido: sincronização do estoque do MySQL para o Redis

        // Agora monta a resposta já com o Redis atualizado
        foreach ($products as $product) {
            $redisStock = Redis::get("product_stock_{$product->id}") ?? $product->quantity;
            $reservedStock = Redis::get("product_reserved_{$product->id}") ?? 0;
            $availableStock = $redisStock - $reservedStock;

            $productsWithStock[] = [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->price,
                'promotion_price' => $product->promotion_price,
                'category' => $product->category,
                'description' => $product->description,
                'image' => $product->image ? asset('storage/' . $product->image) : null,
                'is_promo' => $product->is_promo,
                'is_new' => $product->is_new,
                'total_stock' => (int)$redisStock,
                'reserved_stock' => (int)$reservedStock,
                'available_stock' => max(0, $availableStock),
                'in_stock' => $availableStock > 0,
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at
            ];
        }

        return response()->json($productsWithStock);
    }

    /**
     * ✅ Obter estoque de produto específico
     */
    public function getProductStock($id)
    {
        $product = Product::findOrFail($id);
        $redisStock = Redis::get("product_stock_{$id}") ?? $product->quantity;
        $reservedStock = Redis::get("product_reserved_{$id}") ?? 0;
        $availableStock = $redisStock - $reservedStock;

        return response()->json([
            'product_id' => $id,
            'total_stock' => (int)$redisStock,
            'reserved_stock' => (int)$reservedStock,
            'available_stock' => max(0, $availableStock),
            'in_stock' => $availableStock > 0
        ]);
    }



    /**
     * ✅ Criar pedido + pagamento PIX
     */
    public function storeWithPix(Request $request)
    {
        $data = $request->validate([
            'session_id' => 'required|string',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|string|email',
            'customer_phone' => 'required|string|max:20',
            'address_street' => 'nullable|string',
            'address_neighborhood' => 'nullable|string',
            'items' => 'required|array',
            'items.*.product_id' => ['required', 'regex:/^\\d+$/'],
            'items.*.quantity' => ['required', 'regex:/^\\d+$/', 'min:1'],
            'observations' => 'nullable|string'
        ]);

        $sessionId = $data['session_id'];
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);

        if (!$cartData) {
               return response()->json([
                'message' => 'Seu carrinho expirou! Você tem apenas 10 minutos para escolher seus produtos.'
            ], 410);
        }

        $cart = json_decode($cartData, true);
        // Garante que as chaves do carrinho são inteiras
        $cart = array_combine(
            array_map('intval', array_keys($cart)),
            array_values($cart)
        );

        // Calcular total com base no preço ATUAL do banco
        $totalAmount = 0;
        $orderItems = [];
        foreach ($data['items'] as $item) {
            $productId = (int) $item['product_id'];
            $quantity = (int) $item['quantity'];
            $product = Product::find($productId);
            if ($product) {
                $unitPrice = $product->is_promo && $product->promotion_price !== null ? $product->promotion_price : $product->price;
                $totalPrice = $unitPrice * $quantity;
                $orderItems[] = [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'total_price' => $totalPrice
                ];
                $totalAmount += $totalPrice;
            }
        }

        DB::beginTransaction();
        try {
          
            $randomKey = strtoupper(bin2hex(random_bytes(8)));

            // Criar ordem
            $order = Order::create([
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'customer_phone' => $data['customer_phone'],
                'address_street' => $data['address_street'] ?? null,
                'address_neighborhood' => $data['address_neighborhood'] ?? null,
                'total_amount' => $totalAmount,
                'status' => 'pending_payment',
                'checkout_expires_at' => now()->addMinutes(15),
                'stock_reserved' => true,
                'payment_reference' => $randomKey
            ]);

            // Criar itens da ordem com preço atualizado do banco
            foreach ($orderItems as $orderItem) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $orderItem['product_id'],
                    'product_name' => $orderItem['product_name'],
                    'unit_price' => $orderItem['unit_price'],
                    'quantity' => $orderItem['quantity'],
                    'total_price' => $orderItem['total_price']
                ]);
            }

            // Limpar carrinho
            Redis::del($cartKey);

            // Criar registro de pagamento
            $payment = Payment::create([
                'order_id' => $order->id,
                'provider' => 'mercadopago',
                'status' => 'pending',
                'amount' => $totalAmount
            ]);

            // Se o status do pedido for cancelado, definir pagamento como 'failed'
            if ($request->input('status') === 'canceled') {
                $payment->update(['status' => 'failed']);
            }

            // Gerar PIX passando a chave aleatória
            $pixResponse = app(PaymentWebhookController::class)->gerarPixPagamento($order->id, $randomKey);
            $payment->update([
                'pix_payload' => json_encode($pixResponse)
            ]);

            // Agendar expiração do checkout
            ExpireCheckoutJob::dispatch($order->id)
                ->delay(now()->addMinutes(15));

            DB::commit();

            return response()->json([
                'message' => 'Pedido e pagamento PIX criados com sucesso',
                'order_id' => $order->id,
                'order' => $order->load('items'),
                'payment' => $payment,
                'pix' => $pixResponse,
                'checkout_expires_in_minutes' => 15
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Erro interno do servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ✅ Obter clientes únicos (para admin)
     */
    public function getUniqueCustomers()
    {
        $customers = Order::select('customer_name', 'customer_phone')
            ->distinct()
            ->orderBy('customer_name')
            ->get();

        return response()->json($customers);
    }

    /**
     * ✅ Obter pedidos (para listagem pública)
     */

    public function getPedidos()
    {
        $orders = Order::with(['items', 'payment'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Adiciona o total real somando os itens e inclui status do pagamento
        $orders->getCollection()->transform(function ($order) {
            $order->total_real = collect($order->items)->sum(function ($item) {
                return (float) $item->total_price;
            });
            $order->payment_status = $order->payment ? $order->payment->status : null;
            return $order;
        });

        return response()->json($orders);
    }

    /**
     * ✅ Obter status do pedido
     */
    public function getOrderStatus($id)
    {
        $order = Order::findOrFail($id);
        
        return response()->json([
            'id' => $order->id,
            'status' => $order->status,
            'total_amount' => $order->total_amount,
            'created_at' => $order->created_at,
            'checkout_expires_at' => $order->checkout_expires_at
        ]);
    }

    /**
     * ✅ Rastrear pedido
     */
    public function trackOrder($id)
    {
        $order = Order::with(['items', 'payment'])->findOrFail($id);
        
        return response()->json($order);
    }

    /**
     * ✅ Obter último pedido do cliente
     */
    public function getLastOrderCustomer(Request $request)
    {
        $phone = $request->input('phone');
        
        if (!$phone) {
            return response()->json(['message' => 'Telefone é obrigatório'], 400);
        }
        
        $lastOrder = Order::where('customer_phone', $phone)
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->first();
            
        if (!$lastOrder) {
            return response()->json(['message' => 'Nenhum pedido encontrado'], 404);
        }
        
        return response()->json($lastOrder);
    }

        private function registrarAtualizacaoEstoque($productId, $tipo = 'stock_change') {
        $totalStock = Redis::get("product_stock_{$productId}") ?? 0;
        $reservedStock = Redis::get("product_reserved_{$productId}") ?? 0;
        $availableStock = max(0, $totalStock - $reservedStock);
        $evento = [
            'type' => $tipo,
            'product_id' => $productId,
            'available_stock' => $availableStock,
            'total_stock' => (int)$totalStock,
            'reserved_stock' => (int)$reservedStock,
            'is_available' => $availableStock > 0,
            'is_low_stock' => $availableStock <= 5 && $availableStock > 0,
            'timestamp' => now()->toISOString()
        ];
        Redis::lpush('stock_updates', json_encode($evento));
    }
}