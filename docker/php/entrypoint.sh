#!/bin/sh

echo "🚀 Iniciando setup do Laravel com Jobs e Commands..."

# Aguardar o banco de dados estar pronto
while ! nc -z db 3306; do
  echo "⏳ Aguardando MySQL..."
  sleep 1
done

echo "✅ MySQL conectado!"

# Aguardar Redis estar pronto
while ! nc -z redis 6379; do
  echo "⏳ Aguardando Redis..."
  sleep 1
done

echo "✅ Redis conectado!"

# Ir para o diretório da aplicação
cd /var/www/html

# Instalar dependências do Composer se não existirem
if [ ! -d "vendor" ]; then
    echo "📦 Instalando dependências do Composer..."
    composer install --no-dev --optimize-autoloader --no-interaction
fi

# Gerar chave da aplicação se não existir
if [ ! -f ".env" ]; then
    echo "🔑 Criando arquivo .env..."
    cp .env.example .env
fi

# Verificar se a chave da aplicação existe
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Gerando chave da aplicação..."
    php artisan key:generate --no-interaction
fi

# Criar diretórios de log se não existirem
mkdir -p /var/www/html/storage/logs
mkdir -p /var/log/supervisor

# Executar migrações
echo "🗃️ Executando migrações..."
php artisan migrate --force

# Limpar caches antigos
echo "🧹 Limpando caches..."
php artisan cache:clear --no-interaction
php artisan config:clear --no-interaction
php artisan route:clear --no-interaction
php artisan view:clear --no-interaction

# Otimizar cache de configuração
echo "⚡ Otimizando caches..."
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction

# Configurar permissões
echo "🔐 Configurando permissões..."
chown -R www:www /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Ativar todos os jobs pendentes no Redis
echo "🔄 Ativando jobs no Redis..."
php artisan queue:restart --no-interaction

# Verificar status do Redis
echo "🔴 Verificando conexão Redis..."
php artisan tinker --execute="Redis::ping()" || echo "⚠️ Aviso: Redis não respondeu ao ping"

# Limpar jobs com falha (opcional)
echo "🗑️ Limpando jobs com falha..."
php artisan queue:flush --no-interaction || echo "⚠️ Nenhum job para limpar"

# Publicar jobs de exemplo se existirem
echo "📋 Verificando jobs disponíveis..."
php artisan queue:monitor high,default,background --no-interaction &

echo "✅ Setup concluído com jobs ativados!"

# Executar comando passado como argumento
exec "$@"