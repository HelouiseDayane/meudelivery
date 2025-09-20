#!/bin/bash

echo "🚀 Iniciando BrunoCakes - Sistema Otimizado para Alto Tráfego"

# Verificar se Docker e Docker Compose estão instalados
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f "./brunocakes_backend/.env" ]; then
    echo "📝 Criando arquivo .env do backend..."
    cp ./brunocakes_backend/.env.example ./brunocakes_backend/.env
    
    # Configurar variáveis para Docker
    cat >> ./brunocakes_backend/.env << EOL

# Configurações Docker
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=brunocakes
DB_USERNAME=brunocakes
DB_PASSWORD=brunocakes_secure_pass

# Redis Configuration
REDIS_HOST=redis
REDIS_PASSWORD=redis_secure_pass
REDIS_PORT=6379
REDIS_DB=0

# Cache Configuration
CACHE_DRIVER=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Queue Configuration
QUEUE_CONNECTION=redis

# Configurações de Performance
OCTANE_HTTPS=false
OCTANE_HOST=0.0.0.0
OCTANE_PORT=8000
OCTANE_WORKERS=4

# App Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost

# Log Configuration
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error
EOL
fi

echo "🔧 Construindo containers Docker..."
docker-compose build --no-cache

echo "🚀 Iniciando todos os serviços..."
docker-compose up -d

echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

echo "🔑 Gerando chave da aplicação Laravel..."
docker-compose exec app php artisan key:generate

echo "🗃️ Executando migrações do banco de dados..."
docker-compose exec app php artisan migrate --force

echo "⚡ Otimizando aplicação..."
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
docker-compose exec app php artisan optimize

echo "✅ Sistema BrunoCakes iniciado com sucesso!"
echo ""
echo "📊 URLs de acesso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost"
echo "   MySQL: localhost:3306"
echo "   Redis: localhost:6379"
echo ""
echo "🔧 Comandos úteis:"
echo "   Parar tudo: docker-compose down"
echo "   Ver logs: docker-compose logs -f"
echo "   Reiniciar: docker-compose restart"
echo "   Status: docker-compose ps"
echo ""
echo "🚀 Sistema pronto para alto tráfego!"