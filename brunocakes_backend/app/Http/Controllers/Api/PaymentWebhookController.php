<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Jobs\ProcessOrderJob;

class PaymentWebhookController extends Controller
{
    public function notify(Request $request)
    {
        $paymentId = $request->input('provider_payment_id');
        $status    = $request->input('status'); // paid, failed, pendin$payment = Payment::where('id', $paymentId)->first();

        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        $payment->update(['status' => $status]);

        $order = $payment->order;

        if ($status === 'paid') {
            // Dispara Job para decrementar estoque e reservar pedido
            ProcessOrderJob::dispatch($order->id)->onQueue('orders');
            $order->update(['status' => 'awaiting_seller_confirmation']);
        }

        if ($status === 'failed') {
            // Se o pagamento falhou, devolve estoque
            DB::transaction(function () use ($order) {
                foreach ($order->items as $item) {
                    $product = $item->product;
                    if ($product) {
                        $product->increment('quantity', $item->quantity);
                    }
                }
                $order->update(['status' => 'payment_failed']);
            });
        }

        return response()->json(['message' => 'Webhook processed']);
    }
}
