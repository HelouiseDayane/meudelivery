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
        
        Log::info('Webhook notify chamado [' . __FILE__ . ':' . __LINE__ . ']', [
            'payment_id' => $request->get('payment_id'),
            'status' => $request->get('status'),
            'random_key' => $request->get('random_key'),
            'payload_all' => $request->all(),
            'random_key_type' => gettype($request->get('random_key')),
            'random_key_len' => strlen((string)$request->get('random_key')),
        ]);

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
        \Log::info('DEBUG random_key notify [' . __FILE__ . ':' . __LINE__ . ']', [
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'random_key_recebida' => $randomKey,
            'random_key_recebida_type' => gettype($randomKey),
            'random_key_recebida_len' => strlen((string)$randomKey),
            'random_key_esperada' => $order->payment_reference,
            'random_key_esperada_type' => gettype($order->payment_reference),
            'random_key_esperada_len' => strlen((string)$order->payment_reference),
            'comparacao' => trim((string)$randomKey) === trim((string)$order->payment_reference)
        ]);

        // Validação: payment_id e random_key devem bater com o mesmo pedido
        if (trim((string)$randomKey) !== trim((string)$order->payment_reference)) {
            \Log::warning('Falha na validação da random_key no notify', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'random_key_recebida' => $randomKey,
                'random_key_esperada' => $order->payment_reference
            ]);
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


    public function gerarPixPagamento($orderId, $randomKey = null)
    {
    $order = Order::with('items')->findOrFail($orderId);
    // Se não veio a chave, usa a do pedido
    $randomKey = $randomKey ?: $order->payment_reference;

        // Calcular o valor total
        $valorTotal = $order->items->sum(fn($item) => (float)$item->total_price);

        // Pega o payment
        $payment = Payment::where('order_id', $order->id)->firstOrFail();
        $paymentId = $payment->id;


        // Monta descrição fiscal detalhada
        $descricao = "Bruno Cake\n";
        $descricao .= sprintf("PEDIDO ID: %06d\n", $order->id);
        $descricao .= str_repeat('-', 32) . "\n";
        foreach ($order->items as $item) {
            $descricao .= sprintf("%s x%d - R$ %.2f\n", $item->product_name, $item->quantity, $item->total_price);
        }
        $descricao .= str_repeat('-', 32) . "\n";
        $descricao .= sprintf("TOTAL: R$ %.2f\n", $valorTotal);
        $descricao .= str_repeat('-', 32) . "\n";
        $descricao .= "Cliente: {$order->customer_name}\n";
        $descricao .= "Telefone: {$order->customer_phone}\n";
        $descricao .= "Endereço: ";
        $endereco = [];
        if ($order->address_street) $endereco[] = $order->address_street;
        if ($order->address_neighborhood) $endereco[] = $order->address_neighborhood;
        $descricao .= implode(', ', $endereco) . "\n";
        $descricao .= str_repeat('-', 56) . "\n";


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

        $payload = [
            "random_key" => $randomKey,
            "valor" => (string)number_format($valorTotal, 2, '.', ''),
            "titulo" => "Pagamento PIX",
            "descricao" => (string)$descricao,
            "produtos" => $produtos,
                "referencia_externa" => (string)$order->id,
            "SKU" => $sku,
            "NomeCliente" => (string)$order->customer_name,
            "UltNomeCliente" => $ultNome,
            "email_cliente" => "BRUNO_CAKE-DELIVERY@system.com",
            "DDD_Cliente" => (string)$ddd,
            "Tel_Cliente" => (string)$numero,
            "tipo_notificacao" => "JSON",
            "url_notificacao" => (string)$url_notificacao,
            "texto" => "Pagamento realizado com sucesso!",
        "access_token_plataforma" => "APP_USR-2954630391946213-092217-6b5cdbe01a967e4debb13f09bac7b210-672482120",
        "access_token_vendedor" => "APP_USR-2954630391946213-100808-3cc96bc7814ac50e51d51b762436ffab-2695368729"
        ];


        // Log detalhado do payload serializado para debug
    Log::info('Enviando payload para mppix', [
            'payload' => $payload,
            'random_key' => $randomKey,
            'payload_json' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
        ]);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post('https://01.zapsrv.com/zap_request/delivery/mppix/', $payload);
        

  

        if (!$response->successful()) {
            Log::error('Erro ao disparar mppix', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } else {
            // Se resposta 200, já dispara notify (pagamento aprovado)
            try {
                $notifyResponse = Http::get($url_notificacao);
                Log::info('Notificação enviada para url_notificacao', [
                    'url' => $url_notificacao,
                    'status' => $notifyResponse->status(),
                    'body' => $notifyResponse->body()
                ]);
            } catch (\Exception $e) {
                Log::error('Erro ao enviar notificação para url_notificacao', [
                    'url' => $url_notificacao,
                    'error' => $e->getMessage()
                ]);
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
        \Log::info("Pedido {$order->id} finalizado - Estoque removido definitivamente");
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
            \Log::info('Estoque revertido/cancelado', [
                'order_id' => $order->id,
                'product_id' => $item->product_id,
                'quantity_reverted' => $item->quantity,
                'reserved_before' => $currentReserved,
                'reserved_after' => $newReserved
            ]);
        }

        \Log::info("Pedido {$order->id} cancelado - Estoque revertido");
    }
}