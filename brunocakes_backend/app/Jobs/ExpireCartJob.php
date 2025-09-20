<?php
namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class ExpireCartJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $sessionId;
    public $productId;
    public $quantity;

    public function __construct($sessionId, $productId, $quantity)
    {
        $this->sessionId = $sessionId;
        $this->productId = $productId;
        $this->quantity = $quantity;
    }

    public function handle()
    {
        Log::info('🕒 ExpireCartJob executando', [
            'session_id' => $this->sessionId,
            'product_id' => $this->productId,
            'quantity' => $this->quantity
        ]);

        // Verificar se carrinho ainda existe
        $cartKey = "cart:{$this->sessionId}";
        $reserveKey = "reserve:{$this->sessionId}:{$this->productId}";
        
        $cartExists = Redis::exists($cartKey);
        $reserveExists = Redis::exists($reserveKey);

        if (!$cartExists && !$reserveExists) {
            Log::info('🧹 Carrinho já expirado naturalmente (TTL)', [
                'session_id' => $this->sessionId,
                'product_id' => $this->productId
            ]);
            return;
        }

        // Liberar estoque reservado
        $currentReserved = Redis::get("product_reserved_{$this->productId}") ?? 0;
        $newReserved = max(0, $currentReserved - $this->quantity);
        
        Redis::set("product_reserved_{$this->productId}", $newReserved);
        
        // Remover reserva específica
        Redis::del($reserveKey);
        
        // Remover carrinho se ainda existir
        Redis::del($cartKey);

        Log::info('✅ Estoque liberado automaticamente', [
            'session_id' => $this->sessionId,
            'product_id' => $this->productId,
            'quantity_released' => $this->quantity,
            'reserved_before' => $currentReserved,
            'reserved_after' => $newReserved
        ]);
    }
}