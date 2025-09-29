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
        
        // Salvar reserva individual (para limpeza posterior)
        Redis::setex("reserve:{$sessionId}:{$productId}", 600, $quantity); // 10 min TTL

        // Adicionar ao carrinho
        $cartKey = "cart:{$sessionId}";
        $cartItem = [
            'product_id' => $productId,
            'product_name' => $product->name,
            'unit_price' => $product->price,
            'quantity' => $quantity,
            'total_price' => $product->price * $quantity,
            'image_url' => $product->image ? asset('storage/' . $product->image) : null,
            'expires_at' => now()->addMinutes(10)->toISOString()
        ];

        Redis::setex($cartKey, 600, json_encode([$productId => $cartItem])); // 10 min TTL

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

        return response()->json([
            'message' => 'Produto adicionado ao carrinho',
            'cart_item' => $cartItem,
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
            return response()->json([
                'message' => 'Carrinho vazio ou expirado',
                'cart' => [],
                'total' => 0
            ]);
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
            'items.*.product_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'observations' => 'nullable|string'
        ]);

        $sessionId = $data['session_id'];
        $cartKey = "cart:{$sessionId}";
        $cartData = Redis::get($cartKey);

        if (!$cartData) {
            return response()->json([
                'message' => 'Carrinho vazio ou expirado'
            ], 400);
        }

        $cart = json_decode($cartData, true);
        $totalAmount = array_sum(array_column($cart, 'total_price'));

        DB::beginTransaction();
        try {
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
                'stock_reserved' => true
            ]);

            // Criar itens da ordem
            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $cart[$item['product_id']]['product_name'] ?? '',
                    'unit_price' => $cart[$item['product_id']]['unit_price'] ?? 0,
                    'quantity' => $item['quantity'],
                    'total_price' => $cart[$item['product_id']]['total_price'] ?? 0
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

            // Gerar PIX
            $pixResponse = app(PaymentWebhookController::class)->gerarPixPagamento($order->id);
            $payment->update([
                'pix_payload' => json_encode($pixResponse)
            ]);

            // Agendar expiração do checkout
            ExpireCheckoutJob::dispatch($order->id)
                ->delay(now()->addMinutes(20));

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
        $orders = Order::with('items')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

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
}