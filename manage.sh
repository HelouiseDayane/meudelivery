#!/bin/bash

echo "🔧 Comandos úteis para gerenciar o BrunoCakes"
echo ""

case $1 in
    "logs")
        echo "📋 Visualizando logs..."
        docker-compose logs -f --tail=100
        ;;
    "status")
        echo "📊 Status dos containers:"
        docker-compose ps
        ;;
    "health")
        echo "🏥 Executando health check..."
        ./health-check.sh
        ;;
    "shell-backend")
        echo "🐚 Acessando shell do backend..."
        docker-compose exec app sh
        ;;
    "shell-frontend")
        echo "🐚 Acessando shell do frontend..."
        docker-compose exec frontend sh
        ;;
    "artisan")
        shift
        echo "🔧 Executando comando artisan: $@"
        docker-compose exec app php artisan "$@"
        ;;
    "npm")
        shift
        echo "📦 Executando comando npm: $@"
        docker-compose exec frontend npm "$@"
        ;;
    "mysql")
        echo "🗃️ Conectando ao MySQL..."
        docker-compose exec db mysql -u brunocakes -pbrunocakes_secure_pass brunocakes
        ;;
    "redis")
        echo "🔴 Conectando ao Redis..."
        docker-compose exec redis redis-cli -a redis_secure_pass
        ;;
    "restart")
        echo "🔄 Reiniciando todos os serviços..."
        docker-compose restart
        ;;
    "rebuild")
        echo "🔨 Reconstruindo containers..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    "monitor")
        echo "📈 Monitoramento de recursos..."
        docker stats
        ;;
    "queue-status")
        echo "📋 Status das filas Redis..."
        docker-compose exec redis redis-cli -a redis_secure_pass llen "queues:high"
        echo "Fila HIGH: $(docker-compose exec redis redis-cli -a redis_secure_pass llen 'queues:high') jobs"
        echo "Fila DEFAULT: $(docker-compose exec redis redis-cli -a redis_secure_pass llen 'queues:default') jobs"
        echo "Fila BACKGROUND: $(docker-compose exec redis redis-cli -a redis_secure_pass llen 'queues:background') jobs"
        echo "Jobs FAILED: $(docker-compose exec redis redis-cli -a redis_secure_pass llen 'queues:failed') jobs"
        ;;
    "queue-restart")
        echo "🔄 Reiniciando workers de fila..."
        docker-compose restart queue queue-high queue-background
        docker-compose exec app php artisan queue:restart
        ;;
    "queue-flush")
        echo "🗑️ Limpando todas as filas..."
        docker-compose exec app php artisan queue:flush
        ;;
    "queue-failed")
        echo "❌ Visualizando jobs com falha..."
        docker-compose exec app php artisan queue:failed
        ;;
    "queue-retry")
        echo "🔄 Reprocessando jobs com falha..."
        docker-compose exec app php artisan queue:retry all
        ;;
    "schedule-run")
        echo "⏰ Executando schedule manualmente..."
        docker-compose exec app php artisan schedule:run
        ;;
    "cache-clear")
        echo "🧹 Limpando todos os caches..."
        docker-compose exec app php artisan cache:clear
        docker-compose exec app php artisan config:clear
        docker-compose exec app php artisan route:clear
        docker-compose exec app php artisan view:clear
        ;;
    "optimize")
        echo "⚡ Otimizando aplicação..."
        docker-compose exec app php artisan config:cache
        docker-compose exec app php artisan route:cache
        docker-compose exec app php artisan view:cache
        docker-compose exec app php artisan optimize
        ;;
    "logs-queue")
        echo "📋 Logs dos workers de fila..."
        docker-compose logs -f queue queue-high queue-background
        ;;
    "redis-info")
        echo "🔴 Informações do Redis..."
        docker-compose exec redis redis-cli -a redis_secure_pass info
        ;;
    *)
        echo "Comandos disponíveis:"
        echo ""
        echo "🏥 SAÚDE E STATUS:"
        echo "  health         - Health check completo"
        echo "  status         - Status dos containers"
        echo "  monitor        - Monitor de recursos"
        echo ""
        echo "🔧 GESTÃO BÁSICA:"
        echo "  logs           - Ver logs em tempo real"
        echo "  restart        - Reiniciar serviços"
        echo "  rebuild        - Reconstruir containers"
        echo ""
        echo "🐚 ACESSO:"
        echo "  shell-backend  - Acessar shell do backend"
        echo "  shell-frontend - Acessar shell do frontend"
        echo "  mysql          - Conectar ao MySQL"
        echo "  redis          - Conectar ao Redis"
        echo ""
        echo "📋 FILAS E JOBS:"
        echo "  queue-status   - Status das filas"
        echo "  queue-restart  - Reiniciar workers"
        echo "  queue-flush    - Limpar filas"
        echo "  queue-failed   - Ver jobs com falha"
        echo "  queue-retry    - Reprocessar falhas"
        echo "  logs-queue     - Logs dos workers"
        echo ""
        echo "⏰ SCHEDULE:"
        echo "  schedule-run   - Executar schedule"
        echo ""
        echo "🗃️ DADOS:"
        echo "  redis-info     - Info do Redis"
        echo ""
        echo "⚡ PERFORMANCE:"
        echo "  cache-clear    - Limpar caches"
        echo "  optimize       - Otimizar app"
        echo ""
        echo "🔧 COMANDOS DIRETOS:"
        echo "  artisan [cmd]  - Executar comando artisan"
        echo "  npm [cmd]      - Executar comando npm"
        echo ""
        echo "Exemplo: ./manage.sh queue-status"
        ;;
esac