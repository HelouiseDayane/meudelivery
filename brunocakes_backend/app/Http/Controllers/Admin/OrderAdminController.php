<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;  
use Illuminate\Http\Request;  
use App\Jobs\ProcessOrderJob;  
use Illuminate\Support\Facades\Log; // Adicione esta linha no início do arquivo


class OrderAdminController extends Controller
{
    public function index()
    {
        return response()->json(Order::with('items', 'payment')->latest()->get());
    }

    public function confirmMany(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
        ]);

        // Verifica os pedidos e atualiza apenas os que estão no status correto
        $orders = Order::whereIn('id', $request->order_ids)
            ->where('status', 'awaiting_seller_confirmation')
            ->get();

        $updatedCount = 0;

        foreach ($orders as $order) {
            $order->update(['status' => 'confirmed']);
            $updatedCount++;
        }

        Log::info('Pedidos atualizados:', ['updated_count' => $updatedCount]);

        return response()->json(['updated_count' => $updatedCount]);
    }
                    
                
     public function approvePayment(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
        ]);

        $updatedCount = 0;

        foreach ($request->order_ids as $orderId) {
            Log::info("Aprovando pagamento para o pedido ID: {$orderId}"); // Log para rastrear o ID do pedido
            $order = Order::with('payment')->findOrFail($orderId);
            
            // Verifica se o pagamento está associado ao pedido
            if ($order->payment) {
                Log::info("Pagamento encontrado para o pedido ID: {$orderId}"); // Log se o pagamento existir
                $order->payment->update(['status' => 'paid']); // Atualiza o status do pagamento
                $updatedCount++;
            } else {
                Log::warning("Nenhum pagamento encontrado para o pedido ID: {$orderId}"); // Log se não houver pagamento
            }

            // Atualiza o status do pedido para 'awaiting_seller_confirmation'
            $order->update(['status' => 'awaiting_seller_confirmation']);
            
            // Dispara o Job para processar o pedido
            ProcessOrderJob::dispatch($order->id)->onQueue('orders');
        }

        return response()->json(['updated_count' => $updatedCount]);
    }
        public function cancelPayment(Request $request)
        {
            $request->validate([
                'order_ids' => 'required|array|min:1',
                'order_ids.*' => 'exists:orders,id',
            ]);

            $updatedCount = 0;

            foreach ($request->order_ids as $orderId) {
                $order = Order::with('payment')->findOrFail($orderId);

                // Atualiza o status do pagamento, se existir
                if ($order->payment) {
                    $order->payment->update(['status' => 'cancelled']);
                }

                // Atualiza o status do pedido
                $order->update(['status' => 'cancelled']);

                // Reverte o estoque usando o Job
                $processOrderJob = new ProcessOrderJob($orderId);
                $processOrderJob->revertStock();

                $updatedCount++;
            }

            return response()->json(['updated_count' => $updatedCount]);
        }

        public function markAsCompleted(Request $request)
        {
            $request->validate([
                'order_ids' => 'required|array|min:1',
                'order_ids.*' => 'exists:orders,id',
            ]);

            $updatedCount = 0;

            foreach ($request->order_ids as $orderId) {
                Log::info("Marcando pedido como concluído. Pedido ID: {$orderId}"); // Log para rastrear o ID do pedido
                $order = Order::findOrFail($orderId);

                // Atualiza o status do pedido para 'completed' (como string explícita)
                $order->update(['status' => (string) 'completed']);
                $updatedCount++;
            }

            Log::info('Pedidos concluídos:', ['updated_count' => $updatedCount]);

            return response()->json(['updated_count' => $updatedCount]);
        }
     }