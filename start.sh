#!/bin/bash

# Build e sobe todos os containers
docker-compose build
docker-compose up -d

# Espera MySQL e Redis ficarem prontos
echo "Aguardando MySQL e Redis ficarem prontos..."
docker-compose exec backend bash -c 'until nc -z mysql 3306; do sleep 1; done'
docker-compose exec backend bash -c 'until nc -z redis 6379; do sleep 1; done'

# Espera o backend subir (ajuste tempo se necessário)
echo "Aguardando backend subir..."
sleep 10

# Dá um fresh no banco (apaga e recria tudo)
echo "Rodando: php artisan migrate:fresh --force"
docker-compose run --rm backend php artisan migrate:fresh --force

# Roda os seeders
echo "Rodando: php artisan db:seed --force"
docker-compose run --rm backend php artisan db:seed --force

# Testa conexão com Redis via backend PHP
echo "Testando conexão com Redis via PHP..."
docker-compose exec backend php -r "try { \$r = new Redis(); \$r->connect(getenv('REDIS_HOST'), getenv('REDIS_PORT')); echo \$r->ping(); } catch (Exception \$e) { echo \$e->getMessage(); exit(1); }"

# Testa conexão com Redis via redis-cli
echo "Testando conexão com Redis via CLI..."
docker-compose exec redis redis-cli -a redis_secure_pass ping

# Rodar migrations (por segurança, caso precise)
echo "Rodando migrations..."
docker-compose exec backend php artisan migrate --force

# Executa comandos/artisan jobs customizados
echo "Rodando comandos/artisan jobs customizados..."
docker-compose exec backend php artisan schedule:run
docker-compose exec backend php artisan clean:expired-carts
docker-compose exec backend php artisan sync:monitor-stock

# Executa jobs na fila (em background, até fila esvaziar)
echo "Enfileirando jobs de teste..."
docker-compose run --rm backend php artisan queue:work --stop-when-empty &

echo "Tudo pronto! Containers, banco, jobs e Redis ok."