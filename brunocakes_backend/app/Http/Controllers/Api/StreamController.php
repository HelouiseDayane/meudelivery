<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StreamController extends Controller
{
    /**
     * ✅ NOVA: Stream de atualizações em tempo real via SSE
     */
    public function updates(Request $request)
    {
        $response = new StreamedResponse(function () use ($request) {
            // Headers para SSE
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            header('X-Accel-Buffering: no'); // Para Nginx
            
            $lastEventId = $request->header('Last-Event-ID', 0);
            $clientConnected = true;
            
            while ($clientConnected && !connection_aborted()) {
                try {
                    // Verifica se há atualizações de estoque
                    $stockUpdates = $this->getStockUpdates($lastEventId);
                    
                    if (!empty($stockUpdates)) {
                        foreach ($stockUpdates as $update) {
                            echo "id: {$update['id']}\n";
                            echo "event: stock_update\n";
                            echo "data: " . json_encode($update['data']) . "\n\n";
                            
                            $lastEventId = $update['id'];
                        }
                        
                        if (ob_get_level()) {
                            ob_flush();
                        }
                        flush();
                    }
                    
                    // Heartbeat para manter conexão viva
                    if (time() % 30 === 0) {
                        echo "event: heartbeat\n";
                        echo "data: " . json_encode(['timestamp' => now()->toISOString()]) . "\n\n";
                        
                        if (ob_get_level()) {
                            ob_flush();
                        }
                        flush();
                    }
                    
                    usleep(2000000); // 2 segundos
                    
                } catch (\Exception $e) {
                    \Log::error('SSE Stream Error: ' . $e->getMessage());
                    $clientConnected = false;
                }
                
                // Verifica se cliente ainda está conectado
                if (connection_status() !== CONNECTION_NORMAL) {
                    $clientConnected = false;
                }
            }
        });
        
        return $response;
    }
    
    /**
     * Simula atualizações de estoque (em produção seria um evento real)
     */
    private function getStockUpdates($lastEventId)
    {
        // Pega atualizações de estoque do Redis
        $updates = [];
        $currentTime = time();
        
        // Checa se houve mudanças nos últimos 5 segundos
        $stockKeys = Redis::keys('product_stock_*');
        
        foreach ($stockKeys as $key) {
            $productId = str_replace('product_stock_', '', $key);
            $totalStock = Redis::get($key) ?? 0;
            $reservedStock = Redis::get("product_reserved_{$productId}") ?? 0;
            $availableStock = max(0, $totalStock - $reservedStock);
            
            // Simula verificação de mudança (em produção seria mais sofisticado)
            $updateId = $currentTime . '_' . $productId;
            
            if ($updateId > $lastEventId) {
                $updates[] = [
                    'id' => $updateId,
                    'data' => [
                        'type' => 'stock_change',
                        'product_id' => (int)$productId,
                        'available_stock' => $availableStock,
                        'total_stock' => (int)$totalStock,
                        'reserved_stock' => (int)$reservedStock,
                        'is_available' => $availableStock > 0,
                        'is_low_stock' => $availableStock <= 5 && $availableStock > 0,
                        'timestamp' => now()->toISOString()
                    ]
                ];
            }
        }
        
        return $updates;
    }
    
    /**
     * ✅ NOVA: Força um evento de atualização (para testes)
     */
    public function triggerStockUpdate(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|integer',
            'type' => 'required|string|in:stock_change,low_stock,out_of_stock'
        ]);
        
        // Em produção, isso seria enviado via broadcasting/websockets
        broadcast(new \App\Events\StockUpdated($data['product_id'], $data['type']));
        
        return response()->json([
            'message' => 'Evento de estoque disparado',
            'event_data' => $data
        ]);
    }
}