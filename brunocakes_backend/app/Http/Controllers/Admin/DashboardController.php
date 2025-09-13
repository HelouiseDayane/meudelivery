<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        $salesByDay = Order::whereDate('created_at', $today)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $salesByMonth = Order::whereMonth('created_at', now()->month)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $salesByYear = Order::whereYear('created_at', now()->year)
            ->where('status', 'confirmed')
            ->sum('total_amount');

        $topProductWeek = OrderItem::select('product_name', DB::raw('SUM(quantity) as qty'))
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->groupBy('product_name')
            ->orderByDesc('qty')
            ->first();

        $topProductMonth = OrderItem::select('product_name', DB::raw('SUM(quantity) as qty'))
            ->whereMonth('created_at', now()->month)
            ->groupBy('product_name')
            ->orderByDesc('qty')
            ->first();

        $topNeighborhood = Order::select('address_neighborhood', DB::raw('COUNT(*) as total'))
            ->whereNotNull('address_neighborhood')
            ->groupBy('address_neighborhood')
            ->orderByDesc('total')
            ->first();

        $totalRevenue = Order::where('status', 'confirmed')->sum('total_amount');

        return response()->json([
            'sales_today' => $salesByDay,
            'sales_month' => $salesByMonth,
            'sales_year' => $salesByYear,
            'top_product_week' => $topProductWeek,
            'top_product_month' => $topProductMonth,
            'top_neighborhood' => $topNeighborhood,
            'total_revenue' => $totalRevenue,
        ]);
    }
}
