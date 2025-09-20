<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class ExpireCheckoutJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $orderId;

    public function __construct($orderId)
    {
        $this->orderId = $orderId;
    }

    public function handle()
    {
        Log::info('🕒 ExpireCheckoutJob executando', [
            'order_id' => $this->orderId
        ]);

        $order = Order::with('items')->find($this->orderId);

        if (!$order) {
            Log::warning('⚠️ Ordem não encontrada para expirar', [
                'order_id' => $this->orderId
            ]);
            return;
        }

        // Verificar se ordem já foi processada
        if (in_array($order->status, ['awaiting_seller_confirmation', 'confirmed', 'completed', 'canceled'])) {
            Log::info('✅ Ordem já processada, não precisa expirar', [
                'order_id' => $this->orderId,
                'status' => $order->status
            ]);
            return;
        }

        // Verificar se ainda está dentro do prazo
        if ($order->checkout_expires_at && now()->lt($order->checkout_expires_at)) {
            Log::info('⏰ Ordem ainda dentro do prazo, não expirando', [
                'order_id' => $this->orderId,
                'expires_at' => $order->checkout_expires_at,
                'current_time' => now()
            ]);
            return;
        }

        // Expirar a ordem usando status 'canceled'
        $order->update([
            'status' => 'canceled',
            'stock_reserved' => false
        ]);

        // Liberar estoque de todos os itens
        foreach ($order->items as $item) {
            $currentReserved = Redis::get("product_reserved_{$item->product_id}") ?? 0;
            $newReserved = max(0, $currentReserved - $item->quantity);
            
            Redis::set("product_reserved_{$item->product_id}", $newReserved);
            
            Log::info('📦 Estoque liberado do checkout expirado', [
                'order_id' => $this->orderId,
                'product_id' => $item->product_id,
                'product_name' => $item->product_name,
                'quantity_released' => $item->quantity,
                'reserved_before' => $currentReserved,
                'reserved_after' => $newReserved
            ]);
        }

        // Cancelar pagamento se existir
        if ($order->payment) {
            $order->payment->update(['status' => 'canceled']);
        }

        Log::info('❌ Checkout expirado automaticamente', [
            'order_id' => $this->orderId,
            'status' => 'canceled',
            'items_count' => $order->items->count(),
            'total_amount' => $order->total_amount,
            'customer' => $order->customer_name,
            'reason' => 'Pagamento não confirmado em 10 minutos'
        ]);
    }
}