# 🏪 Guia de Implementação - Sistema Multi-Filiais BrunoCakes

## 📋 Visão Geral

Este guia documenta a implementação completa do sistema de múltiplas filiais no BrunoCakes, incluindo hierarquia de usuários, isolamento de dados por filial, e checkout multi-branch.

---

## 🗄️ 1. Estrutura do Banco de Dados

### Novas Tabelas

#### `branches` (Filiais)
```sql
- id (PK)
- name (varchar 255) - Nome da filial
- code (varchar 50, unique) - Código único da filial
- address (text) - Endereço completo
- phone (varchar 20) - Telefone de contato
- email (varchar 255) - Email da filial
- opening_hours (json) - Horários de funcionamento
- is_open (boolean) - Status de operação no momento
- is_active (boolean) - Filial ativa/inativa
- created_at, updated_at
```

### Tabelas Modificadas

#### `users` - Adicionado:
- `role` (enum: 'master', 'admin', 'employee')
- `branch_id` (FK para branches)

#### `products` - Adicionado:
- `branch_id` (FK para branches)

#### `orders` - Adicionado:
- `branch_id` (FK para branches)

#### `addresses` - Adicionado:
- `branch_id` (FK para branches)

---

## 👥 2. Hierarquia de Usuários

### Níveis de Acesso

| Papel | Descrição | Acesso a Dados |
|-------|-----------|----------------|
| **Master** | Acesso total ao sistema | Todas as filiais (pode filtrar) |
| **Admin** | Gerencia uma filial específica | Apenas sua filial |
| **Employee** | Funcionário operacional | Apenas sua filial |

### Métodos Helper no Model User

```php
// Verificações de papel
$user->isMaster() // true/false
$user->isAdmin() // true/false
$user->isEmployee() // true/false
$user->canAccessAllBranches() // true apenas para master
```

---

## 🔐 3. Middlewares de Proteção

### `CheckRole`
Valida se o usuário possui o papel necessário para acessar a rota.

**Uso nas rotas:**
```php
->middleware('role:master,admin')
```

### `CheckBranchAccess`
Valida se o usuário tem acesso aos dados da filial solicitada.

**Uso nas rotas:**
```php
->middleware('branch.access')
```

---

## 🛣️ 4. Rotas da API

### Rotas de Filiais (Branch)

```
GET    /api/admin/branches        - Listar filiais (master vê todas, outros veem só a sua)
POST   /api/admin/branches        - Criar filial (apenas master)
GET    /api/admin/branches/{id}   - Detalhes da filial
PUT    /api/admin/branches/{id}   - Atualizar filial (apenas master)
DELETE /api/admin/branches/{id}   - Deletar filial (apenas master)
```

**Proteção:** `auth:sanctum`, `role:master` (exceto GET que permite admin/employee)

---

## 📊 5. Dashboard com Filtro de Filial

### Endpoint: `GET /api/admin/dashboard`

**Comportamento:**

- **Master:** 
  - Sem parâmetro `branch_id`: retorna dados de todas as filiais agregados
  - Com parâmetro `branch_id`: retorna dados apenas da filial especificada
  
- **Admin/Employee:**
  - Sempre retorna dados apenas da sua filial atribuída
  - Parâmetro `branch_id` é ignorado

**Exemplo de request (Master):**
```
GET /api/admin/dashboard?branch_id=2
```

**Response:**
```json
{
  "branch_id": 2,
  "branch_name": "Filial Norte",
  "totalOrders": 45,
  "totalRevenue": 4580.50,
  "pendingOrders": 5,
  "completedOrders": 40,
  ...
}
```

---

## 📦 6. Produtos por Filial

### Listagem de Produtos (Admin)
**Endpoint:** `GET /api/admin/products`

- **Master:** vê produtos de todas as filiais (pode filtrar com `branch_id`)
- **Admin/Employee:** vê apenas produtos da sua filial

### Criação de Produto
**Endpoint:** `POST /api/admin/products`

**Payload:**
```json
{
  "name": "Bolo de Chocolate",
  "branch_id": 1,  // Obrigatório para master, ignorado para admin/employee
  "price": 45.90,
  "category": "bolos",
  ...
}
```

- **Master:** deve especificar `branch_id`
- **Admin/Employee:** `branch_id` é automaticamente preenchido com a filial do usuário

---

## 🛒 7. Checkout Multi-Filial

### Fluxo de Checkout

1. **Cliente seleciona a filial** no frontend (menu público)
2. **Frontend envia `branch_id`** ao criar pedido
3. **Backend valida** se a filial está aberta e ativa
4. **Pedido é criado** vinculado à filial selecionada

### Endpoint: `POST /api/checkout/pix`

**Payload atualizado:**
```json
{
  "session_id": "sess_abc123",
  "branch_id": 2,  // NOVO - Obrigatório
  "customer_name": "João Silva",
  "customer_email": "joao@email.com",
  "customer_phone": "(11) 99999-9999",
  "address_street": "Rua das Flores, 123",
  "address_neighborhood": "Centro",
  "items": [
    {"product_id": 1, "quantity": 2},
    {"product_id": 3, "quantity": 1}
  ],
  "observations": "Sem açúcar adicional"
}
```

---

## 📍 8. Endereços com Múltiplas Filiais

### Comportamento de Endereços Ativos

- **Antes:** apenas 1 endereço ativo por cliente
- **Agora:** 1 endereço ativo **por filial** por cliente

### Endpoints Atualizados

#### `GET /api/addresses/active`
Retorna **todos os endereços ativos** das filiais abertas:
```json
[
  {
    "id": 10,
    "rua": "Rua A, 123",
    "bairro": "Centro",
    "ativo": true,
    "branch": {
      "id": 1,
      "name": "Filial Centro",
      "code": "CTR",
      "is_open": true
    }
  },
  {
    "id": 15,
    "rua": "Rua B, 456",
    "bairro": "Norte",
    "ativo": true,
    "branch": {
      "id": 2,
      "name": "Filial Norte",
      "code": "NRT",
      "is_open": true
    }
  }
]
```

#### `POST /api/addresses/{id}/activate`
Ativa o endereço e **desativa outros endereços da mesma filial** (mantém ativos de outras filiais).

---

## 🔄 9. Migrações e Seeders

### Ordem de Execução

```bash
cd brunocakes_backend

# 1. Criar estrutura completa
php artisan migrate:fresh

# 2. Popular dados de teste
php artisan db:seed
```

### Seeders Incluídos

1. **BranchSeeder** - 3 filiais de teste
2. **UserSeeder** - 7 usuários de teste

---

## 🧪 10. Credenciais de Teste

### Usuários Master (Acesso Total)

| Email | Senha | Papel | Filial |
|-------|-------|-------|--------|
| master@brunocakes.com | Master@2025 | Master | - |
| admin@admin.com | Gatopreto11. | Master | - |
| brunocakes@zapsrv.com | BrunoC2k3.s#@. | Master | - |

### Administradores de Filiais

| Email | Senha | Papel | Filial |
|-------|-------|-------|--------|
| admin.centro@brunocakes.com | Admin@2025 | Admin | Filial Centro |
| admin.norte@brunocakes.com | Admin@2025 | Admin | Filial Norte |

### Funcionários

| Email | Senha | Papel | Filial |
|-------|-------|-------|--------|
| func.centro@brunocakes.com | Func@2025 | Employee | Filial Centro |
| func.norte@brunocakes.com | Func@2025 | Employee | Filial Norte |

### Filiais Criadas

| ID | Nome | Código | Status |
|----|------|--------|--------|
| 1 | Filial Centro | CTR | Aberta, Ativa |
| 2 | Filial Norte | NRT | Aberta, Ativa |
| 3 | Filial Sul | SUL | Fechada, Ativa |

---

## 🔧 11. Alterações no Frontend (Pendente)

### Interfaces TypeScript a Atualizar

#### `src/types/Admin.ts`
```typescript
export interface Admin {
  id: number;
  name: string;
  email: string;
  role: 'master' | 'admin' | 'employee';  // NOVO
  branch_id?: number;  // NOVO
  branch?: Branch;  // NOVO
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {  // NOVO
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  opening_hours: any;
  is_open: boolean;
  is_active: boolean;
}
```

#### Outras interfaces para atualizar:
- `Product` - adicionar `branch_id: number` e `branch?: Branch`
- `Order` - adicionar `branch_id: number` e `branch?: Branch`
- `Address` - adicionar `branch_id: number` e `branch?: Branch`

### Componentes a Criar

#### 1. `BranchSelector.tsx` (Admin Dashboard)
Seletor de filial para usuários master no dashboard admin.

**Props:**
```typescript
interface BranchSelectorProps {
  selectedBranchId: number | null;
  onBranchChange: (branchId: number | null) => void;
  branches: Branch[];
}
```

**Comportamento:**
- Exibir apenas se `user.role === 'master'`
- Opção "Todas as filiais" (null)
- Atualizar dashboard ao mudar seleção

#### 2. `PublicBranchSelector.tsx` (Menu Público)
Seletor de filial para clientes no site público.

**Props:**
```typescript
interface PublicBranchSelectorProps {
  selectedBranchId: number | null;
  onBranchSelect: (branch: Branch) => void;
}
```

**Comportamento:**
- Listar apenas filiais com `is_open: true` e `is_active: true`
- Mostrar horários de funcionamento
- Badge "ABERTO" / "FECHADO"
- Ao selecionar, filtrar produtos da filial

### Páginas a Atualizar

#### 1. `AdminDashboard.tsx`
- Adicionar `<BranchSelector />` se `user.role === 'master'`
- Adicionar `branch_id` aos requests da API
- Exibir nome da filial selecionada

#### 2. `PublicMenu.tsx` / `Home.tsx`
- Adicionar `<PublicBranchSelector />` no topo
- Filtrar produtos por `branch_id` selecionado
- Mostrar mensagem se filial estiver fechada

#### 3. `Checkout.tsx`
- Adicionar `branch_id` ao payload do `POST /api/checkout/pix`
- Validar se filial está aberta antes de enviar
- Exibir aviso se filial fechou durante o checkout

### Serviços API a Atualizar

#### `api/admin.ts`
```typescript
export const getDashboard = (branchId?: number) => {
  const params = branchId ? { branch_id: branchId } : {};
  return api.get('/admin/dashboard', { params });
};

export const getProducts = (branchId?: number) => {
  const params = branchId ? { branch_id: branchId } : {};
  return api.get('/admin/products', { params });
};

export const createProduct = (data: ProductFormData) => {
  return api.post('/admin/products', data);
  // Se user.role !== 'master', não enviar branch_id (backend preenche automaticamente)
};

// Novos endpoints de filiais
export const getBranches = () => api.get<Branch[]>('/admin/branches');
export const createBranch = (data: BranchFormData) => api.post('/admin/branches', data);
export const updateBranch = (id: number, data: BranchFormData) => api.put(`/admin/branches/${id}`, data);
export const deleteBranch = (id: number) => api.delete(`/admin/branches/${id}`);
```

#### `api/public.ts`
```typescript
export const getOpenBranches = () => {
  return api.get<Branch[]>('/branches/open');  // Criar este endpoint público
};

export const checkout = (data: CheckoutData) => {
  return api.post('/checkout/pix', {
    ...data,
    branch_id: data.branch_id  // OBRIGATÓRIO
  });
};
```

---

## 📝 12. Checklist de Implementação

### Backend ✅ (Completo)
- [x] Criar migração da tabela `branches`
- [x] Adicionar `role` e `branch_id` em `users`
- [x] Adicionar `branch_id` em `products`, `orders`, `addresses`
- [x] Criar model `Branch` com relacionamentos
- [x] Atualizar models existentes com `branch_id`
- [x] Criar middlewares `CheckRole` e `CheckBranchAccess`
- [x] Criar `BranchController` com CRUD
- [x] Atualizar `AuthController` para retornar `role` e `branch`
- [x] Atualizar `DashboardController` com filtro de filial
- [x] Atualizar `ProductAdminController` com filtro de filial
- [x] Atualizar `OrderAdminController` com filtro de filial
- [x] Atualizar `AddressController` para múltiplos ativos
- [x] Atualizar `CheckoutController` para receber `branch_id`
- [x] Criar seeders de teste
- [x] Registrar middlewares em `bootstrap/app.php`
- [x] Adicionar rotas protegidas em `api.php`

### Frontend ⏳ (Pendente)
- [ ] Atualizar interfaces TypeScript (`Admin`, `Product`, `Order`, `Address`, `Branch`)
- [ ] Criar `BranchSelector` para dashboard admin
- [ ] Criar `PublicBranchSelector` para menu público
- [ ] Atualizar `AdminDashboard` com filtro de filial
- [ ] Atualizar `ProductList` admin com filtro de filial
- [ ] Atualizar `OrderList` admin com filtro de filial
- [ ] Atualizar `PublicMenu` com seletor de filial
- [ ] Atualizar `Checkout` para enviar `branch_id`
- [ ] Adicionar validação de filial aberta no checkout
- [ ] Criar página de gerenciamento de filiais (master)
- [ ] Atualizar serviços API com novos endpoints

### Testes ⏳ (Pendente)
- [ ] Executar migrações em ambiente de desenvolvimento
- [ ] Testar login com diferentes papéis (master, admin, employee)
- [ ] Testar filtro de dashboard por filial
- [ ] Testar criação de produtos por filial
- [ ] Testar isolamento de dados entre filiais
- [ ] Testar checkout com diferentes filiais
- [ ] Testar múltiplos endereços ativos
- [ ] Testar permissões de acesso (master vs admin vs employee)

---

## 🚀 13. Próximos Passos

1. **Executar migrações:**
   ```bash
   cd brunocakes_backend
   php artisan migrate:fresh --seed
   ```

2. **Testar login com usuários de teste** (usar credenciais da seção 10)

3. **Implementar frontend** seguindo checklist da seção 12

4. **Testar fluxo completo:**
   - Login como master → ver todas filiais
   - Login como admin → ver apenas sua filial
   - Login como employee → ver apenas sua filial
   - Cliente público → selecionar filial → fazer pedido

5. **Validar regras de negócio:**
   - Apenas master cria filiais
   - Cada usuário vê dados apenas da sua filial (exceto master)
   - Cliente pode ter múltiplos endereços ativos (um por filial)
   - Pedidos salvos com `branch_id` correto

---

## 📞 14. Suporte

Para dúvidas ou problemas durante a implementação:

- Revisar logs do Laravel: `storage/logs/laravel.log`
- Verificar configuração do banco em `.env`
- Confirmar que Redis está rodando (para carrinho)
- Validar permissões de arquivos no diretório `storage/`

---

## 📄 15. Resumo das Mudanças

### Principais Alterações
1. **Hierarquia de usuários:** 3 níveis (master, admin, employee)
2. **Isolamento de dados:** Cada filial tem seus produtos, pedidos e endereços
3. **Dashboard multi-filial:** Master vê todas, outros veem apenas a sua
4. **Checkout por filial:** Cliente escolhe filial ao fazer pedido
5. **Endereços múltiplos:** 1 endereço ativo por filial (não mais 1 global)

### Compatibilidade
- ✅ Mantém funcionalidade existente para usuários sem filial (legacy)
- ✅ Migrações podem ser revertidas (`rollback`)
- ✅ API retrocompatível (novos campos são opcionais para rotas públicas)

---

**Versão:** 1.0.0  
**Data:** Dezembro 2024  
**Projeto:** BrunoCakes - Sistema Multi-Filiais
