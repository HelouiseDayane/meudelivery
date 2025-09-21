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

class PaymentWebhookController extends Controller
{
    public function notify(Request $request)
    {
        $paymentId = $request->input('payment_id');
        $status = $request->input('status'); // paid, failed, pending
        
        $payment = Payment::with('order.items')->find($paymentId);

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

    /**
     * ✅ NOVA: Simular pagamento para desenvolvimento
     */
    public function simulatePayment(Request $request)
    {
        $data = $request->validate([
            'payment_id' => 'required|exists:payments,id',
            'status' => 'required|in:paid,failed,pending'
        ]);

        $payment = Payment::with('order.items')->find($data['payment_id']);

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        return DB::transaction(function () use ($payment, $data) {
            $order = $payment->order;
            $status = $data['status'];

            if ($status === 'paid') {
                $this->finalizeOrder($order, $payment);
                $message = 'Pagamento simulado como APROVADO';
                
            } elseif ($status === 'failed') {
                $this->revertOrderStock($order, $payment);
                $message = 'Pagamento simulado como REJEITADO';
                
            } else {
                $payment->update(['status' => 'pending']);
                $message = 'Pagamento mantido como PENDENTE';
            }

            return response()->json([
                'message' => $message,
                'order_id' => $order->id,
                'payment_status' => $payment->fresh()->status,
                'order_status' => $order->fresh()->status
            ]);
        });
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