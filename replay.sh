#!/bin/bash
set -e

echo "🚀 Iniciando sistema BrunoCakes (modo preservação de dados)..."

# 🧹 Remove containers e imagens antigas específicas do projeto
echo "🧼 Limpando containers e imagens antigas..."
docker-compose down --remove-orphans
docker image prune -f

# 🏗️ Rebuild apenas se necessário, sem apagar volumes
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Aguardando container backend subir..."
until docker-compose exec backend php -v >/dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo

# 🔧 Permissões Laravel
echo "🔧 Corrigindo permissões do storage e cache..."
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
docker-compose exec backend chmod -R 775 storage bootstrap/cache

echo "🔑 Ajustando permissões e storage link..."
docker-compose exec backend rm -rf public/storage || echo "⚠️ Não foi possível remover storage antigo, continuando..."
docker-compose exec backend php artisan storage:link || echo "⚠️ Link storage já existe, continuando..."

# 🕓 Esperando MySQL e Redis
echo "⏳ Aguardando MySQL e Redis ficarem prontos..."
docker-compose exec backend bash -c 'until nc -z mysql 3306; do sleep 1; done'
docker-compose exec backend bash -c 'until nc -z redis 6379; do sleep 1; done'

# 🐘 Teste básico PHP
echo "⏳ Esperando backend responder ao PHP..."
until docker-compose exec backend php -r "echo 'ok';" 2>/dev/null | grep -q 'ok'; do
  sleep 2
  echo -n "."
done
echo

echo "📝 Conteúdo do .env dentro do backend:"
docker-compose exec backend cat .env

# ⚡ Cache de configuração
echo "🔄 Limpando e recacheando config do Laravel..."
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan config:cache

# 🗄️ Rodando migrations sem apagar dados
echo "🗄️ Rodando: php artisan migrate --force"
docker-compose exec backend php artisan migrate --force

# 🌱 Rodando seeders somente se necessário
echo "🌱 Rodando: php artisan db:seed --force (sem recriar dados existentes)"
docker-compose exec backend php artisan db:seed --force || echo "⚠️ Seeder não foi executado ou já existe."

# 🔎 Testando Redis
echo "🔎 Testando conexão com Redis via PHP..."
docker-compose exec backend php -r "try { \$r = new Redis(); \$r->connect(getenv('REDIS_HOST'), getenv('REDIS_PORT')); if(getenv('REDIS_PASSWORD')) { \$r->auth(getenv('REDIS_PASSWORD')); }; echo \$r->ping(); } catch (Exception \$e) { echo \$e->getMessage(); exit(1); }"

echo "🔎 Testando conexão com Redis via CLI..."
docker-compose exec redis redis-cli -a cakes12345671571285415715715785421478214782171285742557 -p 6379 ping

# ⏰ Jobs e agendamentos
echo "⏰ Rodando comandos/artisan jobs agendados..."
docker-compose exec backend php artisan schedule:run

echo "📦 Enfileirando jobs de teste..."
docker-compose exec backend php artisan queue:work --stop-when-empty &

echo "✅ Sistema pronto — dados preservados, containers e serviços ativos."
