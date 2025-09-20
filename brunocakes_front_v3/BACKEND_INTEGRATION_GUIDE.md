# Rotas Backend Necessárias para Sincronização de Estoque

Para que a sincronização de estoque funcione corretamente, você precisa implementar as seguintes rotas no seu backend Laravel:

## 1. Rotas de Estoque em Tempo Real

### GET /api/products/{id}/stock
Retorna o estoque atual de um produto específico do Redis.

**Exemplo de implementação no ProductController:**
```php
public function getStock($id)
{
    $totalStock = Redis::get("product_stock_{$id}") ?? 0;
    $reservedStock = Redis::get("product_reserved_{$id}") ?? 0;
    $availableStock = max(0, $totalStock - $reservedStock);
    
    return response()->json([
        'product_id' => $id,
        'total_stock' => (int) $totalStock,
        'reserved_stock' => (int) $reservedStock,
        'available_stock' => (int) $availableStock,
    ]);
}
```

### GET /api/products/stock/all
Retorna o estoque de todos os produtos do Redis.

**Exemplo de implementação:**
```php
public function getAllStock()
{
    $products = Product::all();
    $stockData = [];
    
    foreach ($products as $product) {
        $totalStock = Redis::get("product_stock_{$product->id}") ?? 0;
        $reservedStock = Redis::get("product_reserved_{$product->id}") ?? 0;
        $availableStock = max(0, $totalStock - $reservedStock);
        
        $stockData[$product->id] = [
            'total_stock' => (int) $totalStock,
            'reserved_stock' => (int) $reservedStock,
            'available_stock' => (int) $availableStock,
        ];
    }
    
    return response()->json($stockData);
}
```

## 2. Rota para Server-Sent Events (Opcional)

### GET /api/stream/updates
Stream de eventos em tempo real para notificações de estoque.

**Exemplo de implementação:**
```php
public function streamUpdates(Request $request)
{
    return response()->stream(function () {
        $callback = function ($message, $channel = null) {
            $data = json_decode($message, true);
            
            // Formatar evento para SSE
            echo "data: " . json_encode([
                'type' => $data['type'] ?? 'update',
                'data' => $data
            ]) . "\n\n";
            
            if (ob_get_level()) {
                ob_flush();
            }
            flush();
        };
        
        // Configurar header para SSE
        echo "retry: 10000\n\n";
        
        // Escutar eventos Redis (se usando pub/sub)
        Redis::subscribe(['stock-updates', 'cart-expired', 'order-status'], $callback);
        
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache',
        'Connection' => 'keep-alive',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Headers' => 'Cache-Control',
    ]);
}
```

## 3. Adicionar às Rotas (routes/api.php)

```php
// Rotas de estoque em tempo real
Route::get('/products/{id}/stock', [ProductController::class, 'getStock']);
Route::get('/products/stock/all', [ProductController::class, 'getAllStock']);

// Stream de eventos (opcional)
Route::get('/stream/updates', [ProductController::class, 'streamUpdates']);
```

## 4. Melhorias no Sistema Existente

### Notificar mudanças via Redis Pub/Sub
Adicione nas suas funções existentes de carrinho e checkout:

```php
// No addToCart, após reservar estoque:
Redis::publish('stock-updates', json_encode([
    'type' => 'stock_update',
    'product_id' => $productId,
    'total_stock' => Redis::get("product_stock_{$productId}"),
    'reserved_stock' => Redis::get("product_reserved_{$productId}"),
    'available_stock' => $this->getAvailableStock($productId)
]));

// Quando carrinho expira (ExpireCartJob):
Redis::publish('cart-expired', json_encode([
    'type' => 'cart_expired',
    'session_id' => $sessionId,
    'product_ids' => $expiredProductIds
]));

// Quando status do pedido muda:
Redis::publish('order-status', json_encode([
    'type' => 'order_status',
    'order_id' => $order->id,
    'status' => $order->status,
    'customer_phone' => $order->customer_phone
]));
```

## 5. Vantagens do Sistema Implementado

### Frontend:
- ✅ **Estoque em tempo real**: Consulta o Redis a cada 10 segundos
- ✅ **Atualizações otimistas**: Interface responde imediatamente
- ✅ **Recuperação de erro**: Reverte mudanças se API falhar
- ✅ **Indicadores visuais**: Mostra quando estoque está baixo/esgotado
- ✅ **Notificações**: Informa sobre mudanças importantes
- ✅ **SSE (opcional)**: Recebe atualizações instantâneas do servidor

### Backend:
- ✅ **Sistema de reserva**: Estoque reservado durante carrinho/checkout
- ✅ **Expiração automática**: Jobs limpam reservas expiradas
- ✅ **Consistência**: Redis + MySQL sincronizados
- ✅ **Performance**: Redis para operações rápidas

## 6. Como Testar

1. **Teste básico**: Adicione produto ao carrinho e veja estoque diminuir na tela
2. **Teste de múltiplos usuários**: Abra várias abas e veja sincronização
3. **Teste de expiração**: Deixe carrinho expirar e veja estoque voltar
4. **Teste de esgotamento**: Esgote estoque e veja produto desabilitar

## 7. Considerações de Produção

- Configure Redis adequadamente para performance
- Monitore uso de memória do Redis
- Implemente rate limiting nas rotas de estoque
- Use cache HTTP para endpoints menos críticos
- Configure logs para monitorar reservas/liberações de estoque