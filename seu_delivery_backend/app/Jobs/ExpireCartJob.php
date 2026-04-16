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
        $cartKey = "cart:{$this->sessionId}";
        $cartExists = Redis::connection('stock')->exists($cartKey);

        // Se o carrinho ainda existe no Redis, o TTL ainda não expirou.
        // O Redis irá expirar automaticamente; não forçamos a limpeza.
        if ($cartExists) {
            Log::info('⏳ ExpireCartJob: carrinho ainda ativo no Redis, ignorando', [
                'session_id' => $this->sessionId,
            ]);
            return;
        }

        Log::info('🕒 ExpireCartJob executando (carrinho já expirou no Redis)', [
            'session_id' => $this->sessionId,
            'product_id' => $this->productId,
            'quantity' => $this->quantity
        ]);

        // Chama o controller para liberar todas as reservas do carrinho
        try {
            $controller = app(\App\Http\Controllers\Api\CheckoutController::class);
            $controller->clearCart($this->sessionId);
            Log::info('✅ Carrinho expirado e estoque liberado via clearCart', [
                'session_id' => $this->sessionId
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Erro ao liberar carrinho expirado', [
                'session_id' => $this->sessionId,
                'error' => $e->getMessage()
            ]);
        }
    }
}