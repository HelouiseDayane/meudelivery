<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        // ✅ Vendas por dia (últimos 30 dias)
        $salesByDay = Order::selectRaw('DATE(created_at) as date, SUM(total_amount) as amount')
            ->where('status', '!=', 'canceled')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'amount' => (float) $item->amount
                ];
            });

        // ✅ Vendas por mês (últimos 12 meses)
        $salesByMonth = Order::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(total_amount) as amount')
            ->where('status', '!=', 'canceled')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'amount' => (float) $item->amount
                ];
            });

        // ✅ Vendas por ano
        $salesByYear = Order::selectRaw('YEAR(created_at) as year, SUM(total_amount) as amount')
            ->where('status', '!=', 'canceled')
            ->groupBy('year')
            ->orderBy('year', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'year' => (string) $item->year,
                    'amount' => (float) $item->amount
                ];
            });

        // ✅ Receita total
        $totalRevenue = Order::where('status', '!=', 'canceled')->sum('total_amount');

        // ✅ Top produtos do mês atual
        $topProductsMonth = OrderItem::select([
                'product_name as name',
                DB::raw('SUM(quantity) as quantity'),
                DB::raw('SUM(total_price) as revenue')
            ])
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'canceled')
            ->whereMonth('orders.created_at', now()->month)
            ->whereYear('orders.created_at', now()->year)
            ->groupBy('product_name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity' => (int) $item->quantity,
                    'revenue' => (float) $item->revenue
                ];
            });

        // ✅ Vendas por bairro
        $neighborhoodsSales = Order::select([
                'address_neighborhood as neighborhood',
                DB::raw('COUNT(*) as sales'),
                DB::raw('SUM(total_amount) as revenue')
            ])
            ->where('status', '!=', 'canceled')
            ->whereNotNull('address_neighborhood')
            ->where('address_neighborhood', '!=', '')
            ->groupBy('address_neighborhood')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'neighborhood' => $item->neighborhood,
                    'sales' => (int) $item->sales,
                    'revenue' => (float) $item->revenue
                ];
            });

        // ✅ Cálculos para statistics
        $totalOrders = Order::where('status', '!=', 'canceled')->count();
        $totalProducts = Product::where('is_active', true)->count();
        $pendingOrders = Order::where('status', 'pending_payment')->count();
        
        // ✅ Vendas de hoje
        $todaySales = Order::where('status', '!=', 'canceled')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        // ✅ Vendas deste mês
        $thisMonthSales = Order::where('status', '!=', 'canceled')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total_amount');

        // ✅ Vendas deste ano
        $thisYearSales = Order::where('status', '!=', 'canceled')
            ->whereYear('created_at', now()->year)
            ->sum('total_amount');

        // ✅ Estrutura EXATA esperada pelo frontend
        return response()->json([
            'totalRevenue' => (float) $totalRevenue,
            'salesByDay' => $salesByDay,
            'salesByMonth' => $salesByMonth, 
            'salesByYear' => $salesByYear,
            'topProductsMonth' => $topProductsMonth,
            'neighborhoodsSales' => $neighborhoodsSales,
            'statistics' => [
                'todaySales' => (float) $todaySales,
                'monthSales' => (float) $thisMonthSales,
                'yearSales' => (float) $thisYearSales,
                'totalOrders' => $totalOrders,
                'totalProducts' => $totalProducts,
                'pendingOrders' => $pendingOrders,
            ]
        ]);
    }

    /**
     * ✅ Dashboard com filtros de período
     */
    public function dashboardWithFilters(Request $request): JsonResponse
    {
        $startDate = $request->input('start_date', now()->subDays(30));
        $endDate = $request->input('end_date', now());
        
        $query = Order::where('status', '!=', 'canceled')
            ->whereBetween('created_at', [$startDate, $endDate]);
            
        $totalRevenue = $query->sum('total_amount');
        $totalOrders = $query->count();
        
        return response()->json([
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'average_order_value' => $totalOrders > 0 ? $totalRevenue / $totalOrders : 0
            ]
        ]);
    }
}