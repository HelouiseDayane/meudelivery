<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $salesByDay = Order::selectRaw('DATE(created_at) as date, SUM(total) as amount')
            ->groupBy('date')
            ->get();

        $salesByMonth = Order::selectRaw('MONTH(created_at) as month, SUM(total) as amount')
            ->groupBy('month')
            ->get();

        $salesByYear = Order::selectRaw('YEAR(created_at) as year, SUM(total) as amount')
            ->groupBy('year')
            ->get();

        $totalRevenue = Order::sum('total');
        $totalProducts = Product::count();

        return response()->json([
            'salesByDay' => $salesByDay,
            'salesByMonth' => $salesByMonth,
            'salesByYear' => $salesByYear,
            'totalRevenue' => $totalRevenue,
            'totalProducts' => $totalProducts,
        ]);
    }
}
