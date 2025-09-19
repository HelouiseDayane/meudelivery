<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class ProcessOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $orderId;

    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    public function handle()
    {
        DB::transaction(function () {
            $order = Order::with('items.product')->findOrFail($this->orderId);

            // Decrementa estoque (reserva) assim que o pedido for processado
            foreach ($order->items as $item) {
                $product = Product::where('id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($product->quantity < $item->quantity) {
                    // Estoque insuficiente → cancela pedido
                    $order->status = 'failed_stock';
                    $order->save();

                    // Devolve produtos que já tinham sido decrementados
                    foreach ($order->items as $i) {
                        $i->product->increment('quantity', $i->quantity);
                    }
                    return;
                }

                // Decrementa estoque (reserva)
                $product->decrement('quantity', $item->quantity);
            }

            $order->status = 'stock_reserved';
            $order->save();
        });
    }

    // Método para reverter o estoque se o pagamento não for confirmado
    public function revertStock()
    {
        $order = Order::with('items.product')->findOrFail($this->orderId);

        foreach ($order->items as $item) {
            $product = Product::where('id', $item->product_id)->first();
            if ($product) {
                $product->increment('quantity', $item->quantity);
            }
        }

        // Atualiza o status do pedido
        $order->status = 'payment_failed'; // ou outro status apropriado
        $order->save();
    }
}
