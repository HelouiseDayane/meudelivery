# 🧁 Bruno Cake API - Guia Completo de Testes com CURL

Este arquivo contém todos os endpoints da API do Bruno Cake com exemplos práticos de uso em `curl`, explicações detalhadas e cenários de teste.

## 📋 **Índice**
- [Configuração Inicial](#configuração-inicial)
- [Carrinho de Compras](#-carrinho-de-compras)
- [Checkout e Pedidos](#-checkout-e-pedidos)
- [Consultas de Pedidos](#-consultas-de-pedidos)
- [Sistema de Pagamentos](#-sistema-de-pagamentos)
- [Produtos](#-produtos)
- [Área Administrativa](#-área-administrativa)
- [Fluxos Completos de Teste](#-fluxos-completos-de-teste)

---

## 🔧 **Configuração Inicial**

```bash
# Variáveis de ambiente para facilitar os testes
export API_URL="http://localhost:8000/api"
export ADMIN_TOKEN=""  # Será preenchido após login
export SESSION_ID="test_session_$(date +%s)"
```

---

## 🛒 **Carrinho de Compras**

### 1. **Adicionar Produto ao Carrinho**
**Endpoint:** `POST /api/cart/add`  
**Função:** Adiciona um produto ao carrinho temporário no Redis com expiração de 10 minutos e reserva automática de estoque.

```bash
curl -X POST $API_URL/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 2
  }'
```

**Resposta esperada:**
```json
{
  "message": "Produto adicionado ao carrinho",
  "cart_item": {
    "product_id": 1,
    "product_name": "Bolo de Chocolate",
    "unit_price": 25.90,
    "quantity": 2,
    "total_price": 51.80,
    "image_url": "/storage/products/bolo-chocolate.jpg",
    "expires_at": "2025-09-19T15:30:00.000000Z"
  },
  "available_stock": 8,
  "cart_expires_in_minutes": 10
}
```

### 2. **Visualizar Carrinho**
**Endpoint:** `GET /api/cart/session/{session_id}`  
**Função:** Recupera todos os itens do carrinho para uma sessão específica.

```bash
curl -X GET $API_URL/cart/session/$SESSION_ID
```

### 3. **Remover Item do Carrinho**
**Endpoint:** `POST /api/cart/remove`  
**Função:** Remove quantidade específica de um produto e libera estoque reservado.

```bash
curl -X POST $API_URL/cart/remove \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 1
  }'
```

### 4. **Atualizar Quantidade**
**Endpoint:** `POST /api/cart/update`  
**Função:** Atualiza quantidade de um produto no carrinho, ajustando reserva de estoque automaticamente.

```bash
curl -X POST $API_URL/cart/update \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 5
  }'
```

### 5. **Limpar Carrinho Completo**
**Endpoint:** `DELETE /api/cart/session/{session_id}`  
**Função:** Remove todos os itens do carrinho e libera todo estoque reservado.

```bash
curl -X DELETE $API_URL/cart/session/$SESSION_ID
```

### 6. **Reservar Itens do Carrinho**
**Endpoint:** `POST /api/cart/reserve`  
**Função:** Converte reserva temporária em reserva fixa para iniciar checkout.

```bash
curl -X POST $API_URL/cart/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'"
  }'
```

---

## 🛍️ **Checkout e Pedidos**

### 7. **Finalizar Pedido (Checkout)**
**Endpoint:** `POST /api/checkout`  
**Função:** Cria pedido, itens, pagamento PIX e agenda expiração de checkout em 10 minutos.

```bash
curl -X POST $API_URL/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "customer_phone": "11999999999",
    "address_street": "Rua das Flores",
    "address_number": "123",
    "address_neighborhood": "Centro",
    "address_city": "São Paulo",
    "address_state": "SP",
    "address_zip": "01000-000"
  }'
```

**Resposta esperada:**
```json
{
  "order": {
    "id": 1,
    "customer_name": "João Silva",
    "total_amount": 51.80,
    "status": "pending_payment",
    "checkout_expires_at": "2025-09-19T15:40:00.000000Z",
    "items": [...]
  },
  "payment": {
    "id": 1,
    "status": "pending",
    "amount": 51.80,
    "pix_payload": {...}
  },
  "expires_at": "2025-09-19T15:40:00.000000Z",
  "expires_in_minutes": 10
}
```

---

## 📋 **Consultas de Pedidos**

### 8. **Listar Pedidos do Cliente**
**Endpoint:** `GET /api/checkout/pedidos`  
**Função:** Busca todos os pedidos de um cliente por email e/ou telefone.

```bash
# Por email
curl -X GET "$API_URL/checkout/pedidos?customer_email=joao@email.com"

# Por telefone
curl -X GET "$API_URL/checkout/pedidos?customer_phone=11999999999"

# Por ambos
curl -X GET "$API_URL/checkout/pedidos?customer_email=joao@email.com&customer_phone=11999999999"
```

### 9. **Dados do Último Pedido**
**Endpoint:** `GET /api/customer/last-order`  
**Função:** Recupera dados de endereço do último pedido para reutilizar no checkout.

```bash
curl -X GET "$API_URL/customer/last-order?customer_phone=11999999999"
```

### 10. **Status de um Pedido**
**Endpoint:** `GET /api/orders/{id}/status`  
**Função:** Verifica status atual de um pedido específico.

```bash
curl -X GET $API_URL/orders/1/status
```

### 11. **Rastrear Pedido**
**Endpoint:** `GET /api/orders/{id}/track`  
**Função:** Dados completos de rastreamento com histórico.

```bash
curl -X GET $API_URL/orders/1/track
```

---

## 💳 **Sistema de Pagamentos**

### 12. **Webhook de Pagamento**
**Endpoint:** `POST /api/payment/notify`  
**Função:** Recebe notificação do provedor de pagamento e atualiza status do pedido.

```bash
curl -X POST $API_URL/payment/notify \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": 1,
    "status": "paid"
  }'
```

**Status possíveis:** `paid`, `failed`, `pending`

### 13. **Simular Pagamento (Desenvolvimento)**
**Endpoint:** `POST /api/payment/simulate`  
**Função:** Simula aprovação/rejeição de pagamento para testes.

```bash
# Aprovar pagamento
curl -X POST $API_URL/payment/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": 1,
    "status": "paid"
  }'

# Rejeitar pagamento
curl -X POST $API_URL/payment/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": 1,
    "status": "failed"
  }'
```

---

## 📦 **Produtos**

### 14. **Listar Todos os Produtos**
**Endpoint:** `GET /api/products`  
**Função:** Lista todos os produtos ativos com informações de estoque.

```bash
curl -X GET $API_URL/products
```

### 15. **Produto Específico**
**Endpoint:** `GET /api/products/{id}`  
**Função:** Detalhes completos de um produto específico.

```bash
curl -X GET $API_URL/products/1
```

### 16. **Analytics Públicos**
**Endpoint:** `GET /api/analytics`  
**Função:** Estatísticas públicas da loja.

```bash
curl -X GET $API_URL/analytics
```

---

## 🔐 **Área Administrativa**

### 17. **Login de Administrador**
**Endpoint:** `POST /api/admin/login`  
**Função:** Autentica administrador e retorna token de acesso.

```bash
TOKEN=$(curl -X POST $API_URL/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@brunocakes.com",
    "password": "senha123"
  }' | jq -r '.token')

export ADMIN_TOKEN=$TOKEN
```

### 18. **Dashboard Administrativo**
**Endpoint:** `GET /api/admin/dashboard`  
**Função:** Estatísticas gerais da loja.

```bash
curl -X GET $API_URL/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 19. **Gerenciar Produtos**

#### Listar produtos (admin)
```bash
curl -X GET $API_URL/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Criar produto
```bash
curl -X POST $API_URL/admin/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bolo de Morango",
    "description": "Delicioso bolo de morango",
    "price": 29.90,
    "quantity": 10,
    "category": "bolos",
    "is_active": true
  }'
```

#### Atualizar produto
```bash
curl -X PUT $API_URL/admin/products/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bolo de Chocolate Premium",
    "price": 35.90
  }'
```

#### Atualizar estoque
```bash
curl -X PATCH $API_URL/admin/products/1/stock \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50
  }'
```

### 20. **Gerenciar Pedidos**

#### Listar pedidos
```bash
curl -X GET $API_URL/admin/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Aprovar pagamento
```bash
curl -X PATCH $API_URL/admin/orders/approve-payment \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1
  }'
```

#### Cancelar pedido
```bash
curl -X PATCH $API_URL/admin/orders/1/cancel \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Forçar expiração
```bash
curl -X PATCH $API_URL/admin/orders/1/force-expire \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 21. **Sistema e Manutenção**

#### Sincronizar estoque
```bash
curl -X POST $API_URL/admin/products/sync-stock \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Limpar carrinhos expirados
```bash
curl -X POST $API_URL/admin/system/clean-expired-carts \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Estatísticas do Redis
```bash
curl -X GET $API_URL/admin/system/redis-stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🧪 **Fluxos Completos de Teste**

### **Cenário 1: Compra Bem-sucedida**
```bash
#!/bin/bash
set -e

# 1. Configuração
SESSION_ID="test_$(date +%s)"
API_URL="http://localhost:8000/api"

echo "🚀 Iniciando teste de compra completa..."
echo "Session ID: $SESSION_ID"

# 2. Adicionar produtos ao carrinho
echo "📦 Adicionando produtos ao carrinho..."
curl -s -X POST $API_URL/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 2
  }' | jq '.'

# 3. Verificar carrinho
echo "🛒 Verificando carrinho..."
curl -s -X GET $API_URL/cart/session/$SESSION_ID | jq '.'

# 4. Finalizar pedido
echo "✅ Finalizando pedido..."
ORDER_RESPONSE=$(curl -s -X POST $API_URL/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "customer_name": "Teste Automatizado",
    "customer_phone": "11999999999",
    "customer_email": "teste@brunocakes.com"
  }')

echo $ORDER_RESPONSE | jq '.'

# 5. Extrair IDs
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order.id')
PAYMENT_ID=$(echo $ORDER_RESPONSE | jq -r '.payment.id')

echo "📋 Pedido criado: #$ORDER_ID"
echo "💳 Pagamento: #$PAYMENT_ID"

# 6. Simular pagamento aprovado
echo "💰 Simulando pagamento aprovado..."
curl -s -X POST $API_URL/payment/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": '$PAYMENT_ID',
    "status": "paid"
  }' | jq '.'

# 7. Verificar status final
echo "🔍 Verificando status final..."
curl -s -X GET $API_URL/orders/$ORDER_ID/status | jq '.'

echo "✅ Teste completo finalizado!"
```

### **Cenário 2: Carrinho com Expiração**
```bash
#!/bin/bash

SESSION_ID="expire_test_$(date +%s)"

# Adicionar ao carrinho
curl -X POST $API_URL/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 1
  }'

echo "⏰ Carrinho criado. Aguarde 10 minutos para expiração automática..."
echo "🔍 Verificar estoque após expiração com:"
echo "curl -X GET $API_URL/products/1"
```

### **Cenário 3: Estoque Insuficiente**
```bash
#!/bin/bash

SESSION_ID="stock_test_$(date +%s)"

# Tentar adicionar quantidade maior que estoque
curl -X POST $API_URL/cart/add \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "'$SESSION_ID'",
    "product_id": 1,
    "quantity": 9999
  }'
```

---

## 📊 **Códigos de Status HTTP**

| Código | Significado | Quando Ocorre |
|--------|-------------|---------------|
| 200 | OK | Operação bem-sucedida |
| 201 | Created | Pedido criado com sucesso |
| 400 | Bad Request | Estoque insuficiente, dados inválidos |
| 401 | Unauthorized | Token inválido ou expirado |
| 404 | Not Found | Produto/pedido não encontrado |
| 422 | Unprocessable Entity | Erro de validação |
| 500 | Internal Server Error | Erro interno do servidor |

---

## 🔍 **Dicas de Debugging**

### Verificar logs do Laravel
```bash
tail -f storage/logs/laravel.log
```

### Monitorar Redis
```bash
redis-cli monitor
```

### Verificar estoque no Redis
```bash
redis-cli
> GET product_stock_1
> GET product_reserved_1
> KEYS cart:*
```

### Limpar cache para testes
```bash
redis-cli FLUSHALL
php artisan cache:clear
```

---

## 📝 **Notas Importantes**

1. **Expiração Automática**: Carrinhos expiram em 10 minutos automaticamente
2. **Reserva de Estoque**: Estoque é reservado ao adicionar no carrinho
3. **Transações**: Checkout usa transações de banco para consistência
4. **Jobs Assíncronos**: Sistema usa filas para processar expirações
5. **Redis**: Cache usado para controle de estoque em tempo real

---

**Última atualização:** 19 de setembro de 2025  
**Versão da API:** 1.0  
**Ambiente:** Desenvolvimento