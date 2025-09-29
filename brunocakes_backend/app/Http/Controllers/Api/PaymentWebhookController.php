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
        $paymentId = $request->input('payment_id');
        $idSession = $request->input('id_session');
        $status = $request->input('status'); // paid, failed, pending

        // Busca por payment_id ou session_id na tabela orders
        if ($paymentId) {
            $payment = Payment::with('order.items')->find($paymentId);
        } elseif ($idSession) {
            $order = Order::where('session_id', $idSession)->first();
            if (!$order) {
                return response()->json(['error' => 'Order com session_id não encontrada'], 404);
            }
            $payment = Payment::with('order.items')->where('order_id', $order->id)->first();
        } else {
            return response()->json(['error' => 'Payment id ou session id não informado'], 400);
        }

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        return DB::transaction(function () use ($payment, $status) {
            $order = $payment->order;

            if ($status === 'paid') {
                // Pagamento aprovado - finaliza venda
                $this->finalizeOrder($order, $payment);
            } elseif ($status === 'failed') {
                // Pagamento falhou - reverte estoque
                $this->revertOrderStock($order, $payment);
            }

            return response()->json(['message' => 'Webhook processed']);
        });
    }

    public function gerarPixPagamento($orderId)
    {
        $order = Order::with('items')->findOrFail($orderId);
        // Recupera session id (SKU) - pode ser passado via parâmetro ou buscar no Payment
        $payment = Payment::where('order_id', $order->id)->first();
        $id_session = $payment ? ($payment->provider_payment_id ?? $order->id) : $order->id;

        // Monta descrição detalhada dos itens
        $descricao = "";
        foreach ($order->items as $item) {
            $descricao .= "{$item->product_name} (Qtd: {$item->quantity}, Preço: R$ {$item->unit_price}) | ";
        }
        $descricao = rtrim($descricao, '| ');
        $descricao = "PEDIDO ID: REF-{$order->id} || " . $descricao;

        // Extrai DDD e número do telefone
        $ddd = null;
        $numero = null;
        if (preg_match('/\((\d{2,3})\)\s*(\d{4,5}-\d{4})/', $order->customer_phone, $matches)) {
            $ddd = $matches[1];
            $numero = preg_replace('/\D/', '', $matches[2]);
        } else {
            // fallback: extrai só números
            $numero = preg_replace('/\D/', '', $order->customer_phone);
        }

        // Monta url de notificação com id_session
        $url_notificacao = "https://brunocakes.zapsrv.com/api/payment/notify?id_session={$id_session}";

    $payload = [
        "valor" => (string)number_format($order->total_amount, 2, '.', ''),
        "titulo" => "Pagamento PIX Bruno Cake",
        "descricao" => (string)$descricao,
        "referencia_externa" => (string)"REF-{$order->id}",
        "SKU" => (string)$id_session,
        "NomeCliente" => (string)$order->customer_name,
        "UltNomeCliente" => "",
        "email_cliente" => (string)$order->customer_email,
        "DDD_Cliente" => (string)$ddd,
        "Tel_Cliente" => (string)$numero,
        "tipo_notificacao" => "GET | POST | JSON",
        "url_notificacao" => (string)$url_notificacao,
        "texto" => "Pagamento realizado com sucesso!",
        "access_token_plataforma" => "APP_USR-2954630391946213-092217-6b5cdbe01a967e4debb13f09bac7b210-672482120",
        "access_token_vendedor" => "APP_USR-2954630391946213-092218-3c911573cc885ff46d176fd1e56b3a10-41047718"
    ];

       
        \Log::info('Enviando payload para mppix', ['payload' => $payload]);

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

        return $response->json();
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