# ⚠️ ATENÇÃO: Migrações Pendentes

## Erro Detectado

```
Column not found: 1054 Unknown column 'branch_id' in 'where clause'
```

Isso significa que as migrações do sistema multi-filiais ainda não foram executadas no banco de dados.

## Como Corrigir

### Opção 1: Via Terminal (Recomendado)

```bash
cd /home/helouisedayane/Documentos/BrunoCakes/brunocakes_backend

# Dar permissões aos diretórios (pode precisar de sudo)
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:www-data storage bootstrap/cache

# Executar migrações
php artisan migrate --force

# Popular dados de teste
php artisan db:seed --class=BranchSeeder
php artisan db:seed --class=UserSeeder
```

### Opção 2: Via Docker (se estiver usando)

```bash
# Entrar no container
docker exec -it brunocakes_app bash

# Dentro do container
php artisan migrate --force
php artisan db:seed --class=BranchSeeder
php artisan db:seed --class=UserSeeder

# Sair
exit
```

### Opção 3: Resetar banco completamente (CUIDADO: Apaga todos os dados)

```bash
cd /home/helouisedayane/Documentos/BrunoCakes/brunocakes_backend

# Limpar e recriar tudo
php artisan migrate:fresh --seed
```

## O que as migrações fazem

1. **Criar tabela `branches`** - Armazena as filiais
2. **Adicionar `branch_id` em:**
   - `users` (usuários associados à filial)
   - `products` (produtos por filial)
   - `orders` (pedidos por filial)
   - `addresses` (endereços por filial)
3. **Adicionar campo `role`** em `users` (master/admin/employee)

## Dados de Teste que serão criados

### Filiais:
- Filial Centro (ID: 1, Código: CTR) - Aberta
- Filial Norte (ID: 2, Código: NRT) - Aberta
- Filial Sul (ID: 3, Código: SUL) - Fechada

### Usuários:
| Email | Senha | Papel | Filial |
|-------|-------|-------|--------|
| master@brunocakes.com | Master@2025 | Master | - |
| admin.centro@brunocakes.com | Admin@2025 | Admin | Centro |
| admin.norte@brunocakes.com | Admin@2025 | Admin | Norte |
| func.centro@brunocakes.com | Func@2025 | Employee | Centro |
| func.norte@brunocakes.com | Func@2025 | Employee | Norte |

## Após executar as migrações

1. Recarregue a aplicação frontend
2. Faça logout e login novamente
3. Teste as funcionalidades:
   - Seletor de filial no menu público
   - Cadastro de usuários em /admin/users
   - Filtro de filial no dashboard (apenas master)
   - Cadastro de endereços com filial associada

## Problemas Comuns

### "Permission denied" ao executar migrate

**Solução:**
```bash
# Opção 1: Usar sudo
sudo php artisan migrate --force

# Opção 2: Mudar dono dos arquivos
sudo chown -R $USER:$USER storage bootstrap/cache
```

### "SQLSTATE[HY000] [1045] Access denied"

**Solução:** Verifique as credenciais do banco no arquivo `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=brunocakes
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

### Migrations não aparecem

**Solução:**
```bash
# Limpar cache
php artisan config:clear
php artisan cache:clear

# Tentar novamente
php artisan migrate --force
```

## Status Atual

✅ **Frontend:** Todos os componentes criados e prontos
❌ **Backend:** Migrações pendentes de execução
⏳ **Banco de Dados:** Aguardando criação das colunas e tabelas

Execute as migrações agora para ativar o sistema multi-filiais!
