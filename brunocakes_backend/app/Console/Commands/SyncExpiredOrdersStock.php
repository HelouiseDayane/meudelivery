<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use App\Jobs\ExpireCheckoutJob;
use Illuminate\Support\Facades\Redis;

class SyncExpiredOrdersStock extends Command
{
    protected $signature = 'sync:expired-orders-stock {--product=}';
    protected $description = 'Libera estoque de pedidos expirados/cancelados que ainda possuem itens reservados';

    public function handle()
    {
        $productId = $this->option('product');
        if ($productId) {
            // Limpa reserva do produto específico, ignorando pedidos
            $reservedKey = "product_reserved_{$productId}";
            $reserved = Redis::get($reservedKey);
            if ($reserved > 0) {
                Redis::set($reservedKey, 0);
                Redis::incrby("product_stock_{$productId}", $reserved);
                $this->info("Reserva fantasma removida do produto #{$productId} (devolvido {$reserved} ao estoque)");
            } else {
                $this->info("Nenhuma reserva encontrada para o produto #{$productId}");
            }
            return;
        }

        // Apenas remove dos reservados as quantidades de produtos de reservas expiradas (carrinhos abandonados >10min)
        $allProductIds = \DB::table('products')->pluck('id');
        foreach ($allProductIds as $productId) {
            $reservedKey = "product_reserved_{$productId}";
            $pattern = "reserve:*:{$productId}";
            $keys = Redis::keys($pattern);
            $totalActive = 0;
            $totalExpired = 0;
            foreach ($keys as $key) {
                $ttl = Redis::ttl($key);
                $qty = Redis::get($key);
                // Tenta extrair o orderId da chave (reserve:{orderId}:{productId})
                $parts = explode(':', $key);
                $orderId = isset($parts[1]) ? $parts[1] : null;
                $orderStatus = null;
                if ($orderId) {
                    $order = \DB::table('orders')->where('id', $orderId)->first();
                    $orderStatus = $order ? $order->status : null;
                }
                // Só exclui reservas expiradas de pedidos que NÃO são delivered, confirmed ou completed
                if ($ttl > 0) {
                    if ($qty > 0) {
                        $totalActive += $qty;
                    }
                } else {
                    if (!in_array($orderStatus, ['delivered', 'confirmed', 'completed'])) {
                        Redis::del($key);
                        if ($qty > 0) {
                            $totalExpired += $qty;
                        }
                    } else {
                        // Reserva expirada mas pedido está em status final, mantém
                        if ($qty > 0) {
                            $totalActive += $qty;
                        }
                    }
                }
            }
            // Atualiza o reservado para refletir apenas reservas ativas
            Redis::set($reservedKey, $totalActive);
            $this->info("Reserva ajustada do produto #{$productId}: {$totalActive} ativo, removido dos expirados: {$totalExpired}");
            // Emite evento SSE para o frontend
            if (class_exists('App\\Http\\Controllers\\Api\\CheckoutController')) {
                $controller = new \App\Http\Controllers\Api\CheckoutController();
                $controller->registrarAtualizacaoEstoque($productId, 'stock_change');
            }
        }
    }
}
