<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class SyncStockJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $productId;

    public function __construct($productId)
    {
        $this->productId = $productId;
    }

    public function handle()
    {
        $product = Product::find($this->productId);
        if (!$product) {
            Log::warning("SyncStockJob: Produto não encontrado", ['product_id' => $this->productId]);
            return;
        }

        $redisStock = Redis::get("product_stock_{$this->productId}");
        $mysqlStock = $product->quantity;
        Log::info("SyncStockJob: Estoque antes da sync", [
            'product_id' => $this->productId,
            'redisStock' => $redisStock,
            'mysqlStock' => $mysqlStock
        ]);

        // Sempre atualiza o MySQL com o valor do Redis
        $product->update(['quantity' => $redisStock]);
        Log::info("SyncStockJob: MySQL atualizado para o valor do Redis", [
            'product_id' => $this->productId,
            'novo_mysqlStock' => $redisStock
        ]);

        // Garante que Redis está atualizado
        Redis::set("product_stock_{$this->productId}", $redisStock);
        Log::info("SyncStockJob: Estoque após sync", [
            'product_id' => $this->productId,
            'redisStock_final' => Redis::get("product_stock_{$this->productId}"),
            'mysqlStock_final' => $redisStock
        ]);
    }
}