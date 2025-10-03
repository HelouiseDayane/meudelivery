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


class PaymentWebhookController extends Controller
{
    public function notify(Request $request)
    {
        \Log::info('Webhook notify chamado', [
            'payment_id' => $request->input('payment_id'),
            'status' => $request->input('status'),
            'payload' => $request->all()
        ]);


        $paymentId = $request->input('payment_id');
        $status = $request->input('status'); // paid, failed, pending
        $randomKey = $request->input('random_key');

        if (!$paymentId) {
            return response()->json(['error' => 'Payment id não informado'], 400);
        }

        $payment = Payment::with('order.items')->find($paymentId);

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        $order = $payment->order;

        // Validação da random_key: deve ser a do pedido deste payment_id
        if (!$randomKey || $randomKey !== $order->payment_reference) {
            \Log::warning('Falha na validação da random_key no notify', [
                'order_id' => $order->id,
                'payment_id' => $paymentId,
                'random_key_recebida' => $randomKey,
                'random_key_esperada' => $order->payment_reference
            ]);
            return response()->json(['error' => 'Chave de validação inválida'], 403);
        }

        // Validação extra: garantir que a random_key não está sendo usada para outro payment_id
        $otherPayment = Payment::whereHas('order', function($q) use ($randomKey, $order) {
            $q->where('payment_reference', $randomKey)->where('id', '!=', $order->id);
        })->first();
        if ($otherPayment) {
            \Log::warning('Tentativa de usar random_key de outro pedido', [
                'payment_id' => $paymentId,
                'order_id' => $order->id,
                'random_key' => $randomKey,
                'other_payment_id' => $otherPayment->id,
                'other_order_id' => $otherPayment->order_id
            ]);
            return response()->json(['error' => 'Chave de validação não pertence a este pagamento/pedido'], 403);
        }

        return DB::transaction(function () use ($payment, $status) {
            $order = $payment->order;

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
        });
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

    // Url de notificação usando payment_id e random_key
    $url_notificacao = "https://brunocakes.zapsrv.com/api/payment/notify?payment_id={$paymentId}&status=paid&random_key={$randomKey}";

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
            "referencia_externa" => (string)"REF-{$order->id}",
            "SKU" => $sku,
            "NomeCliente" => (string)$order->customer_name,
            "UltNomeCliente" => $ultNome,
            "email_cliente" => $emailCliente,
            "DDD_Cliente" => (string)$ddd,
            "Tel_Cliente" => (string)$numero,
            "tipo_notificacao" => "GET | POST | JSON",
            "url_notificacao" => (string)$url_notificacao,
            "texto" => "Pagamento realizado com sucesso!",
        "access_token_plataforma" => "APP_USR-2954630391946213-092217-6b5cdbe01a967e4debb13f09bac7b210-672482120",
        "access_token_vendedor" => "APP_USR-2954630391946213-092218-3c911573cc885ff46d176fd1e56b3a10-41047718"
        ];


        // Log detalhado do payload serializado para debug
        \Log::info('Enviando payload para mppix', [
            'payload' => $payload,
            'random_key' => $randomKey,
            'payload_json' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
        ]);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post('https://01.zapsrv.com/zap_request/delivery/mppix/', $payload);

        \Log::info('Status HTTP mppix', ['status' => $response->status()]);
        \Log::info('Resposta mppix', ['response' => $response->body()]);

        if (!$response->successful()) {
            \Log::error('Erro ao disparar mppix', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
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
            // Adiciona de volta ao estoque no Redis
            Redis::incrby("product_stock_{$item->product_id}", $item->quantity);
            
            // Atualiza MySQL
            DB::table('products')
                ->where('id', $item->product_id)
                ->increment('quantity', $item->quantity);
            
            // ✅ Dispara evento de atualização de estoque
            broadcast(new StockUpdated($item->product_id, 'stock_increased'));
            
            // Sincroniza Redis com MySQL
            dispatch(new SyncStockJob($item->product_id));
        }

        \Log::info("Pedido {$order->id} cancelado - Estoque revertido");
    }
}