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
            $order->update(['status' => 'confirmed']);
            
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

            // ✅ Atualizar payment status primeiro
            if ($order->payment) {
                $order->payment->update(['status' => 'failed']);
            }

            // ✅ Atualizar order status antes de reverter estoque
            $order->update(['status' => 'canceled']);

            // ✅ Reverter estoque (sem duplicar update do status)
            $processOrderJob = new ProcessOrderJob($orderId);
            $processOrderJob->revertStock();

            $updatedCount++;
            
            Log::info('Pedido cancelado', [
                'order_id' => $orderId,
                'customer' => $order->customer_name,
                'payment_status' => $order->payment ? 'failed' : 'no_payment'
            ]);
        }

        return response()->json(['updated_count' => $updatedCount]);
    }

    public function markAsCompleted(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'exists:orders,id',
        ]);

        // ✅ FILTRAR apenas pedidos com status 'confirmed'
        $orders = Order::whereIn('id', $request->order_ids)
            ->where('status', 'confirmed') // ✅ Apenas 'confirmed' pode ser completado
            ->get();

        $updatedCount = 0;

        foreach ($orders as $order) {
            $order->update(['status' => 'completed']);
            $updatedCount++;
            
            Log::info('Pedido marcado como completo', [
                'order_id' => $order->id,
                'customer' => $order->customer_name,
                'total' => $order->total_amount
            ]);
        }

        Log::info('Pedidos marcados como completos', [
            'requested_count' => count($request->order_ids),
            'updated_count' => $updatedCount
        ]);

        return response()->json([
            'message' => 'Pedidos marcados como completos',
            'requested_count' => count($request->order_ids),
            'updated_count' => $updatedCount
        ]);
    }


            
    
    public function getUniqueCustomers()
    {
        $customers = Order::select([
            'customer_name',
            'customer_email',
            'customer_phone',
            \DB::raw('COUNT(*) as total_orders'),
            \DB::raw('SUM(total_amount) as total_spent'),
            \DB::raw('MAX(created_at) as last_order_date'),
            \DB::raw('MAX(address_street) as address_street'),
            \DB::raw('MAX(address_neighborhood) as address_neighborhood')
        ])
        ->whereNotNull('customer_phone')
        ->where('customer_phone', '!=', '')
        ->groupBy([
            'customer_name',
            'customer_email',
            'customer_phone'
        ])
        ->orderBy('customer_name')
        ->get()
        ->map(function ($customer) {
            return [
                'name' => $customer->customer_name,
                'email' => $customer->customer_email,
                'phone' => $customer->customer_phone,
                'address' => $customer->address_street,
                'neighborhood' => $customer->address_neighborhood,
                'totalOrders' => (int) $customer->total_orders,
                'totalSpent' => (float) $customer->total_spent,
                'lastOrderDate' => $customer->last_order_date
            ];
        });

        return response()->json($customers);
    }
    }