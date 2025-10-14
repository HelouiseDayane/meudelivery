<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use App\Jobs\SyncStockJob;
use App\Events\StockUpdated;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


class PaymentWebhookController extends Controller
{

    public function notify(Request $request)
    {
        // Log detalhado de todos os dados recebidos (apenas query string)
        

        // Exige payment_id e random_key
        $paymentId = $request->get('payment_id');
        $randomKey = $request->get('random_key');
        $status = $request->get('status'); // paid, failed, pending

        if (!$paymentId || !$randomKey) {
            return response()->json(['error' => 'payment_id e random_key são obrigatórios'], 400);
        }

        $payment = Payment::with('order.items')->find($paymentId);
        if (!$payment) {
            return response()->json(['error' => 'Pagamento não encontrado'], 404);
        }
        $order = $payment->order;
        if (!$order) {
            return response()->json(['error' => 'Pedido não encontrado'], 404);
        }

        // Log detalhado para depuração da random_key

        // Validação: payment_id e random_key devem bater com o mesmo pedido
        if (trim((string)$randomKey) !== trim((string)$order->payment_reference)) {
            return response()->json(['error' => 'Chave de validação inválida'], 403);
        }

        // Se status for "paid", confirma o pedido
        if ($status === 'paid') {
            $this->finalizeOrder($order, $payment);
        } elseif ($status === 'failed') {
            $this->revertOrderStock($order, $payment);
        }

        $order->refresh();
        $payment->refresh();

        return response()->json([
            'message' => 'Webhook processed',
            'order_status' => $order->status,
            'payment_status' => $payment->status,
            'order_id' => $order->id,
            'payment_id' => $payment->id
        ]);
    }


    public function gerarPixPagamento($orderId, $randomKey = null, $descricao = null)
    {
    $order = Order::with('items')->findOrFail($orderId);
    // Se não veio a chave, usa a do pedido
    $randomKey = $randomKey ?: $order->payment_reference;

    // Calcular o valor total
    $valorTotal = $order->items->sum(fn($item) => (float)$item->total_price);

    // Pega o payment
    $payment = Payment::where('order_id', $order->id)->firstOrFail();
    $paymentId = $payment->id;

    // Se $descricao vier do CheckoutController, usa ele. Senão, monta padrão.
    if (!$descricao) {
        $descricao .= "==============================\n";
        $nomeCliente = mb_strimwidth($order->customer_name, 0, 32);
        $descricao .= "BRUNO CAKE\n";
        $descricao .= "==============================\n";
        // Sempre mostra ID antes do pagamento aprovado
        $descricao .= "Pedido: ID: " . str_pad($order->id, 6, '0', STR_PAD_LEFT) . "\n";
        $descricao .= "Nome: $nomeCliente\n";
        $descricao .= "Tel: {$order->customer_phone}\n";
        $descricao .= "------------------------------\n";
        foreach ($order->items as $item) {
            $nomeProduto = mb_strimwidth($item->product_name, 0, 28);
            $descricao .= "Item: $nomeProduto\n";
            $descricao .= "Qtd: {$item->quantity}  Vlr: R$" . number_format($item->total_price, 2, ',', '') . "\n";
        }
        $descricao .= "------------------------------\n";
        $descricao .= "Pedido: R$" . number_format($valorTotal, 2, ',', '') . "\n";
        $descricao .= "Total:  R$" . number_format($valorTotal, 2, ',', '') . "\n";
        $descricao .= "Pagamento: {$order->payment_method}\n";
        $descricao .= "Retirada no local.\n";
        $descricao .= "==============================\n\n\n\n";
        $descricao .= strtoupper("Já recebi o seu pedido! 🙌\nAssim que ele estiver pronto pra ser retirado, eu te aviso, tá bom?\n\nVolto já com a confirmação! 🍰\n");
    }


        $produtos = [];
        foreach ($order->items as $item) {
            $produtos[] = [
                'id' => $item->product_id,
                'nome' => $item->product_name,
                'quantidade' => $item->quantity,
                'preco' => $item->unit_price,
                'total' => $item->total_price,
            ];
        }

        // Extrai telefone
        $ddd = null;
        $numero = preg_replace('/\D/', '', $order->customer_phone ?? '');
        if (preg_match('/^(\d{2})(\d+)$/', $numero, $matches)) {
            $ddd = $matches[1];
            $numero = $matches[2];
        }

         $url_notificacao = "https://apibrunocakes.zapsrv.com/api/payment/notify?payment_id={$paymentId}&status=paid&random_key={$randomKey}";
        // Gerar SKU único (igual ao exemplo)
        $sku = 'TORA' . $order->id . '-' . strtoupper(\Str::random(12));

        // Pega sobrenome se existir
        $nomeParts = explode(' ', trim($order->customer_name));
        $ultNome = count($nomeParts) > 1 ? array_pop($nomeParts) : 'Integrado';

        // E-mail padrão se não houver
        $emailCliente = $order->customer_email ?: 'BRUNO_CAKE-DELIVERY@system.com';

        // Só no retorno/finalização, usa REF
        $referencia_externa = ($payment->status === 'paid')
            ? "REF-" . strtoupper(str_pad(dechex($order->id), 6, '0', STR_PAD_LEFT))
            : "ID: " . str_pad($order->id, 6, '0', STR_PAD_LEFT);

        $payload = [
            "random_key" => $randomKey,
            "valor" => (string)number_format($valorTotal, 2, '.', ''),
            "titulo" => "Bruno Miranda Cake",
            "descricao" => (string)$descricao,
            "produtos" => $produtos,
            "referencia_externa" => $referencia_externa,
            "SKU" => $sku,
            "NomeCliente" => (string)$order->customer_name,
            "UltNomeCliente" => $ultNome,
            "email_cliente" => $emailCliente,
            "DDD_Cliente" => (string)$ddd,
            "Tel_Cliente" => (string)$numero,
            "tipo_notificacao" => "JSON",
            "url_notificacao" => (string)$url_notificacao,
            "texto" => "Pagamento realizado com sucesso!",
            "access_token_plataforma" => "APP_USR-2954630391946213-092217-6b5cdbe01a967e4debb13f09bac7b210-672482120",
            // token  de bruno
            //"access_token_vendedor" => "APP_USR-2954630391946213-100315-2f7106bdebe76537390c481f76ae4245-2695368729"

            /// meu token
            "access_token_vendedor" => "APP_USR-2954630391946213-092218-3c911573cc885ff46d176fd1e56b3a10-41047718"
        ];


        // Log detalhado do payload serializado para debug

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post('https://01.zapsrv.com/zap_request/delivery/mppix/', $payload);
        

  

        if ($response->successful()) {
            // Se resposta 200, já dispara notify (pagamento aprovado)
            try {
                $notifyResponse = Http::get($url_notificacao);
            } catch (\Exception $e) {
                // erro silencioso
            }
        }

        return response()->json([
            'message' => 'Pedido e pagamento PIX criados com sucesso',
            'order_id' => $order->id,
            'payment_id' => $paymentId,
            'response_api' => $response->json(),
        ]);
    }



    private function finalizeOrder($order, $payment)
    {
        // Atualiza status do pagamento
        $payment->update(['status' => 'paid']);
        // Atualiza status do pedido
        $order->update([
            'status' => 'confirmed',
            'stock_reserved' => false
        ]);

        // Dispara evento de atualização de status do pedido
        broadcast(new \App\Events\OrderStatusUpdated($order));

        // Remove definitivamente do estoque (Redis e MySQL)
        foreach ($order->items as $item) {
            // Remove do estoque no Redis (já estava reservado, agora remove definitivo)
            Redis::decrby("product_stock_{$item->product_id}", $item->quantity);
            // Atualiza MySQL
            DB::table('products')
                ->where('id', $item->product_id)
                ->decrement('quantity', $item->quantity);
            // ✅ Dispara evento de atualização de estoque
            broadcast(new StockUpdated($item->product_id, 'stock_decreased'));
            // Sincroniza Redis com MySQL
            dispatch(new SyncStockJob($item->product_id));
        }
    }

    private function revertOrderStock($order, $payment)
    {
        // Atualiza status do pagamento
        $payment->update(['status' => 'failed']);
        
        // Atualiza status do pedido
        $order->update([
            'status' => 'canceled',
            'stock_reserved' => false
        ]);

        // Reverte estoque (Redis e MySQL)
        foreach ($order->items as $item) {
            // Remove do reservado no Redis
            $reservedKey = "product_reserved_{$item->product_id}";
            $currentReserved = Redis::get($reservedKey) ?? 0;
            $newReserved = max(0, $currentReserved - $item->quantity);
            Redis::set($reservedKey, $newReserved);

            // Adiciona de volta ao estoque disponível no Redis
            Redis::incrby("product_stock_{$item->product_id}", $item->quantity);

            // Atualiza MySQL
            DB::table('products')
                ->where('id', $item->product_id)
                ->increment('quantity', $item->quantity);

            // ✅ Dispara evento de atualização de estoque
            broadcast(new StockUpdated($item->product_id, 'stock_increased'));

            // Sincroniza Redis com MySQL
            dispatch(new SyncStockJob($item->product_id));

            // Log detalhado
        }
    }
}