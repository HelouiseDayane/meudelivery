# 🔧 Correção: Edição de Produtos não Funcionando

## Problema Identificado

O curl funcionou perfeitamente, mas o frontend não estava editando produtos. Analisei o curl que funcionou:

```bash
curl -X PUT http://localhost:8000/api/admin/products/18 \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json" \
  -F "name=Produto Atualizado" \
  -F "price=35.90" \
  -F "quantity=15" \
  -F "category=Categoria Atualizada" \
  -F "description=Descrição atualizada" \
  -F "is_promo=true" \
  -F "promotion_price=29.90" \
  -F "is_active=true"
```

## Correções Implementadas

### 1. **Remoção do Campo `slug`**
❌ **Antes:** Frontend enviava campo `slug` que o backend pode não esperar
✅ **Depois:** Removido campo `slug` da payload

### 2. **Campos Opcionais Melhorados**
❌ **Antes:** Enviava campos com `null` ou vazios
✅ **Depois:** Só envia campos opcionais quando têm valor real

```tsx
// ANTES
const productData = {
  name: formData.name,
  slug: generateSlug(formData.name), // ❌ Campo extra
  expires_at: formData.expiryDate || null, // ❌ null desnecessário
  promotion_price: promotionPriceValue, // ❌ podia ser null
  // ...
};

// DEPOIS
const productData: any = {
  name: formData.name.trim(),
  description: formData.description.trim(),
  price: priceValue,
  category: formData.category.trim(),
  quantity: stockValue,
  is_promo: formData.isPromotion,
  is_new: formData.isNew,
  is_active: formData.available,
};

// Só adiciona se tem valor
if (promotionPriceValue) {
  productData.promotion_price = promotionPriceValue;
}
if (formData.expiryDate) {
  productData.expires_at = formData.expiryDate;
}
```

### 3. **Logs de Debug Detalhados**

**No `api_admin.ts`:**
```tsx
console.log('🔄 api_admin.updateProduct - dados recebidos:', data);
console.log('📤 FormData criado com os seguintes campos:');
for (let [key, value] of formData.entries()) {
  console.log(`  ${key}: ${value}`);
}
```

**No `adminApiRequest`:**
```tsx
console.log(`🌐 Fazendo requisição para: ${url}`);
console.log(`📋 Método: ${defaultOptions.method || 'GET'}`);
console.log(`📡 Resposta recebida - Status: ${response.status}`);
```

### 4. **Validação Aprimorada**
- ✅ Validação individual de cada campo obrigatório
- ✅ Verificação de números válidos
- ✅ Trim em strings para remover espaços extras
- ✅ Mensagens de erro específicas

### 5. **Headers Otimizados**
- ✅ Removido `Content-Type` manual para FormData
- ✅ Deixa o browser definir automaticamente o boundary

## Como Debugar Agora

### 1. **Console do Navegador (F12)**
Ao editar um produto, você verá logs como:
```
📤 Enviando dados do produto: {...}
🔄 api_admin.updateProduct - dados recebidos: {...}
📤 FormData criado com os seguintes campos:
  name: Produto Teste
  price: 25.90
  quantity: 15
  ...
🌐 Fazendo requisição para: http://localhost:8000/api/admin/products/18
📋 Método: PUT
📡 Resposta recebida - Status: 200
✅ Dados recebidos: {...}
```

### 2. **Campos Enviados Exatamente Como no Curl**
- `name`: string
- `description`: string  
- `price`: number
- `category`: string
- `quantity`: number (não `stock`)
- `is_promo`: boolean
- `is_new`: boolean
- `is_active`: boolean
- `promotion_price`: number (opcional)
- `expires_at`: date (opcional)
- `file`: File (opcional)

### 3. **Teste Manual**
Execute o arquivo de teste para verificar:
```bash
node test-product-edit.js
```

## Possíveis Problemas Restantes

Se ainda não funcionar, verifique:

1. **Token válido**: No console do navegador execute `localStorage.getItem('admin_token')`
2. **Backend rodando**: Endpoint `/admin/products` acessível
3. **Permissões**: Usuário admin tem permissão para editar produtos
4. **Campos obrigatórios**: Backend pode ter validações extras

## Estrutura da Requisição Final

```
PUT /api/admin/products/{id}
Headers:
  - Authorization: Bearer {token}
  - Accept: application/json
  - Content-Type: multipart/form-data (automático)

Body (FormData):
  - name: "Produto Teste"
  - description: "Descrição"
  - price: "25.90"
  - category: "Categoria"
  - quantity: "15"
  - is_promo: "false"
  - is_new: "false"  
  - is_active: "true"
  [+ campos opcionais se preenchidos]
```

**Agora a edição de produtos deve funcionar exatamente como no curl!** 🎉