<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
   public function index()
{
    $today = now()->toDateString();

    // ✅ Vendas em valor (somente confirmados)
    $salesByDay = Order::whereDate('created_at', $today)
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->sum('total_amount');

    $ordersByDay = Order::whereDate('created_at', $today)
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->count();

    $salesByMonth = Order::whereMonth('created_at', now()->month)
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->sum('total_amount');

    $ordersByMonth = Order::whereMonth('created_at', now()->month)
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->count();

    $salesByYear = Order::whereYear('created_at', now()->year)
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->sum('total_amount');

    // ✅ Top produtos (somente confirmados)
    $topProductWeek = OrderItem::select('product_name', DB::raw('SUM(quantity) as qty'))
        ->whereHas('order.payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
        ->groupBy('product_name')
        ->orderByDesc('qty')
        ->first();

    $topProductMonth = OrderItem::select('product_name', DB::raw('SUM(quantity) as qty'))
        ->whereHas('order.payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->whereMonth('created_at', now()->month)
        ->groupBy('product_name')
        ->orderByDesc('qty')
        ->first();

    // ✅ Top bairro (somente confirmados)
    $topNeighborhood = Order::select('address_neighborhood', DB::raw('COUNT(*) as total'))
        ->whereNotNull('address_neighborhood')
        ->whereHas('payment', function($query) {
            $query->where('status', 'confirmed');
        })
        ->groupBy('address_neighborhood')
        ->orderByDesc('total')
        ->first();

    // ✅ Faturamento total (somente confirmados)
    $totalRevenue = Order::whereHas('payment', function($query) {
        $query->where('status', 'confirmed');
    })->sum('total_amount');

    // ✅ Estatísticas de tickets (status puro da ordem, não do pagamento)
    $ticketStats = [
        'total_created' => Order::count(),
        'pending_payment' => Order::where('status', 'pending_payment')->count(),
        'awaiting_confirmation' => Order::where('status', 'awaiting_seller_confirmation')->count(),
        'confirmed' => Order::where('status', 'confirmed')->count(),
        'completed' => Order::where('status', 'completed')->count(),
        'canceled' => Order::where('status', 'canceled')->count(),
        
        // Estatísticas de pagamento
        'payments_pending' => Payment::where('status', 'pending')->count(),
        'payments_paid' => Payment::where('status', 'paid')->count(),
        'payments_failed' => Payment::where('status', 'failed')->count(),
        
        // Estatísticas do mês atual
        'tickets_this_month' => Order::whereMonth('created_at', now()->month)->count(),
        'paid_this_month' => Order::whereMonth('created_at', now()->month)
            ->whereHas('payment', function($query) {
                $query->where('status', 'paid');
            })->count(),
        'canceled_this_month' => Order::whereMonth('created_at', now()->month)
            ->where('status', 'canceled')->count(),
    ];

    return response()->json([
        'sales_today' => $salesByDay,
        'orders_today' => $ordersByDay,
        'sales_month' => $salesByMonth,
        'orders_month' => $ordersByMonth,
        'sales_year' => $salesByYear,
        'top_product_week' => $topProductWeek,
        'top_product_month' => $topProductMonth,
        'top_neighborhood' => $topNeighborhood,
        'total_revenue' => $totalRevenue,
        'ticket_statistics' => $ticketStats,
    ]);
}

}