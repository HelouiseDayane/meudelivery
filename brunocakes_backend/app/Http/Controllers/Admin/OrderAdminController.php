<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;

class OrderAdminController extends Controller
{
    public function index()
    {
        return response()->json(Order::with('items', 'payment')->latest()->get());
    }

    public function show(Order $order)
    {
        return response()->json($order->load('items', 'payment'));
    }

    public function confirm(Order $order)
    {
        if ($order->status !== 'awaiting_seller_confirmation') {
            return response()->json(['error' => 'Order not ready to confirm'], 422);
        }

        $order->update([
            'status' => 'confirmed',
            'pickup_info_visible' => true,
        ]);

        return response()->json($order);
    }
}
