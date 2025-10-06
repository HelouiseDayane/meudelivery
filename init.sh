#!/bin/bash
set -e

echo "🚀 Iniciando sistema BrunoCakes..."

docker-compose build --no-cache
docker-compose up -d

echo "⏳ Aguardando container backend subir..."
until docker-compose exec backend php -v >/dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo

# Corrige permissões do Laravel
echo "🔧 Corrigindo permissões do storage e cache..."
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
docker-compose exec backend chmod -R 775 storage bootstrap/cache

# Permissões e storage link (adicionados aqui)
echo "🔑 Ajustando permissões e storage link..."
# Remove permissões antigas do storage link
docker-compose exec backend rm -rf public/storage || echo "⚠️ Não foi possível remover storage antigo, continuando..."

docker-compose exec backend php artisan storage:link || echo "⚠️ Link storage já existe, continuando..."

# Espera MySQL e Redis ficarem prontos
echo "⏳ Aguardando MySQL e Redis ficarem prontos..."
docker-compose exec backend bash -c 'until nc -z mysql 3306; do sleep 1; done'
docker-compose exec backend bash -c 'until nc -z redis 6379; do sleep 1; done'


# Aguarda backend responder ao PHP
echo "⏳ Esperando backend responder ao PHP..."
until docker-compose exec backend php -r "echo 'ok';" 2>/dev/null | grep -q 'ok'; do
  sleep 2
  echo -n "."
done
echo

echo "📝 Conteúdo do .env dentro do backend:"
docker-compose exec backend cat .env

echo "🔄 Limpando e recacheando config do Laravel..."
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan config:cache

echo "🗄️ Rodando: php artisan migrate:fresh --force"
docker-compose exec backend php artisan migrate:fresh --force

echo "🌱 Rodando: php artisan db:seed --force"
docker-compose exec backend php artisan db:seed --force

echo "🔎 Testando conexão com Redis via PHP..."
docker-compose exec backend php -r "try { \$r = new Redis(); \$r->connect(getenv('REDIS_HOST'), getenv('REDIS_PORT')); if(getenv('REDIS_PASSWORD')) { \$r->auth(getenv('REDIS_PASSWORD')); }; echo \$r->ping(); } catch (Exception \$e) { echo \$e->getMessage(); exit(1); }"

echo "🔎 Testando conexão com Redis via CLI..."
docker-compose exec redis redis-cli -a cakes12345671571285415715715785421478214782171285742557 -p 6379 ping

echo "⏰ Rodando comandos/artisan jobs agendados..."
docker-compose exec backend php artisan schedule:run

echo "📦 Enfileirando jobs de teste..."
docker-compose exec backend php artisan queue:work --stop-when-empty &

echo "✅ Tudo pronto! Containers, banco, jobs e Redis ok."