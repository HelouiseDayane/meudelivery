# Sistema de Expiração de Carrinho e Checkout - Bruno Cake

## Resumo das Implementações

### 1. Hook useExpiration (`src/hooks/useExpiration.ts`)
- **Funcionalidade**: Gerencia countdown em tempo real para expiração de carrinho/checkout
- **Características**:
  - Atualização em tempo real (1 segundo)
  - Detecção de avisos (≤ 2 minutos)
  - Detecção crítica (≤ 1 minuto) 
  - Callbacks para expiração e avisos
  - Formatação automática do tempo (MM:SS)
  - Reset automático quando `expiresAt` muda

### 2. Componente ExpirationNotification (`src/components/ExpirationNotification.tsx`)
- **Funcionalidade**: Interface visual para notificações de expiração
- **Estados visuais**:
  - **Expirado**: Alerta vermelho com ação para limpar/voltar
  - **Crítico (≤ 1 min)**: Alerta vermelho com urgência
  - **Aviso (≤ 2 min)**: Alerta amarelo informativo
- **Tipos suportados**: 'cart' e 'checkout'

### 3. Atualizações no App Context (`src/App.tsx`)
- **Novos estados**:
  - `cartExpiresAt`: Data de expiração do carrinho
  - `checkoutExpiresAt`: Data de expiração do checkout
- **Novas funções**:
  - `clearExpiredCart()`: Limpa carrinho expirado
- **Integrações**:
  - `addToCart()`: Captura `expires_at` do backend
  - `createOrder()`: Retorna `{ orderId, expiresAt }` e define checkout expiration

### 4. API Updates (`src/api.ts`)
- **createOrder**: Agora inclui `session_id` no payload

### 5. Componente Cart (`src/components/public/Cart.tsx`)
- **Integrações**:
  - Hook `useExpiration` para monitorar expiração do carrinho
  - Componente `ExpirationNotification` no topo da página
  - Redirecionamento automático ao menu quando expirado

### 6. Componente Checkout (`src/components/public/Checkout.tsx`)
- **Integrações**:
  - Hook `useExpiration` para monitorar expiração do checkout
  - Componente `ExpirationNotification` após header
  - Redirecionamento automático ao carrinho quando expirado
  - Atualizado `handleSubmit` para usar novo formato de retorno

## Fluxo de Funcionamento

### 1. Adição ao Carrinho
1. Usuário clica em "Adicionar ao Carrinho"
2. `addToCart()` chama API backend
3. Backend retorna `expires_at` (10 minutos)
4. Frontend armazena em `cartExpiresAt`
5. Hook `useExpiration` inicia countdown
6. Notificação visual aparece quando necessário

### 2. Durante Navegação no Carrinho
1. `ExpirationNotification` mostra tempo restante
2. Avisos visuais em 2 min (amarelo) e 1 min (vermelho)
3. Quando expira: carrinho é limpo e usuário redirecionado

### 3. No Checkout
1. Ao criar pedido, backend define nova expiração
2. `checkoutExpiresAt` é atualizado
3. Timer de checkout inicia independentemente
4. Se expirar: usuário volta ao carrinho

### 4. Estados Visuais
- **Normal**: Sem notificação
- **Aviso (≤ 2 min)**: Barra amarela com ícone de relógio
- **Crítico (≤ 1 min)**: Barra vermelha com ícone de alerta
- **Expirado**: Barra vermelha com botão de ação

## Integração com Backend

O sistema espera que o backend Laravel retorne:

### addToCart Response:
```json
{
  "available_stock": 5,
  "expires_at": "2024-12-19T10:30:00Z"
}
```

### createOrder Response:
```json
{
  "order": { "id": 123, ... },
  "checkout_expires_at": "2024-12-19T10:40:00Z",
  "payment": { ... }
}
```

## Benefícios Implementados

1. **Transparência**: Usuário sempre sabe quanto tempo tem
2. **Avisos Progressivos**: Alertas crescentes conforme tempo diminui
3. **Auto-limpeza**: Sistema limpa automaticamente itens expirados
4. **UX Consistente**: Mesmo padrão visual para cart e checkout
5. **Integração Completa**: Sincronizado com sistema de reservas do backend

## Arquivos Modificados

- ✅ `src/hooks/useExpiration.ts` (novo)
- ✅ `src/components/ExpirationNotification.tsx` (novo)
- ✅ `src/App.tsx` (atualizado)
- ✅ `src/api.ts` (atualizado)
- ✅ `src/components/public/Cart.tsx` (atualizado)
- ✅ `src/components/public/Checkout.tsx` (atualizado)

## Teste Disponível

- `src/TestExpiration.tsx`: Componente de teste independente para validar o sistema