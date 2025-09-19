<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessOrderJob;

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_name'     => 'required|string|max:255',
            'customer_email'    => 'nullable|email',
            'customer_phone'    => 'required|string|max:20',
            'address_street'    => 'nullable|string|max:255',
            'address_number'    => 'nullable|string|max:50',
            'address_neighborhood' => 'nullable|string|max:255',
            'address_city'      => 'nullable|string|max:255',
            'address_state'     => 'nullable|string|max:50',
            'address_zip'       => 'nullable|string|max:20',
            'items'             => 'required|array|min:1',
            'items.*.product_id'=> 'required|exists:products,id',
            'items.*.quantity'  => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'customer_name'  => $data['customer_name'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_phone' => $data['customer_phone'],
                'address_street' => $data['address_street'] ?? null,
                'address_number' => $data['address_number'] ?? null,
                'address_neighborhood' => $data['address_neighborhood'] ?? null,
                'address_city'   => $data['address_city'] ?? null,
                'address_state'  => $data['address_state'] ?? null,
                'address_zip'    => $data['address_zip'] ?? null,
                'total_amount'   => 0,
                'status'         => 'pending_payment',
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
                $product = \App\Models\Product::findOrFail($item['product_id']);
                $lineTotal = $product->price * $item['quantity'];

                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'unit_price'   => $product->price,
                    'quantity'     => $item['quantity'],
                    'total_price'  => $lineTotal,
                ]);

                $total += $lineTotal;
            }

            $order->update(['total_amount' => $total]);

            $payment = Payment::create([
                'order_id' => $order->id,
                'status'   => 'pending',
                'amount'   => $total,
                'provider' => 'pix_provider',
                'pix_payload' => json_encode([
                    'qr_code' => 'FAKE_QR_CODE_STRING',
                    'copy_paste' => 'FAKE_PIX_CODE'
                ]),
            ]);

            return response()->json([
                'order' => $order->load('items'),
                'payment' => $payment,
            ], 201);
        });
    }

    public function getPedidos(Request $request)
    {
        $request->validate([
            'customer_email' => 'nullable|email',
            'customer_phone' => 'nullable|string|max:20',
        ]);

        $query = Order::query();

        if ($request->filled('customer_email')) {
            $query->where('customer_email', $request->customer_email);
        }
        if ($request->filled('customer_phone')) {
            $query->where('customer_phone', $request->customer_phone);
        }

        $orders = $query->with('items')->get();

        return response()->json($orders);
    }

    public function getLastOrderCustomer(Request $request)
    {
        $request->validate([
            'customer_phone' => 'required|string|max:20',
        ]);

        $customer = Order::select([
            'customer_name',
            'customer_email',
            'customer_phone',
            'address_street',
            'address_number',
            'address_neighborhood'
        ])
        ->where('customer_phone', $request->customer_phone)
        ->orderBy('created_at', 'desc')
        ->first();

        if (!$customer) {
            return response()->json([
                'message' => 'Cliente não encontrado'
            ], 404);
        }

        return response()->json($customer);
    }
}
