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
            return;
        }

        // Pega estoque atual do Redis
        $redisStock = Redis::get("product_stock_{$this->productId}") ?? 0;
        
        // Se diferente do MySQL, atualiza MySQL
        if ($product->quantity != $redisStock) {
            $product->update(['quantity' => $redisStock]);
            Log::info("Estoque sincronizado - Produto {$this->productId}: MySQL {$product->quantity} -> {$redisStock}");
        }

        // Garante que Redis está atualizado
        Redis::set("product_stock_{$this->productId}", $product->quantity);
    }
}