#!/bin/bash

echo "🏥 Sistema de Health Check - BrunoCakes"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar status de serviço
check_service() {
    local service=$1
    local status=$(docker-compose ps -q $service 2>/dev/null)
    
    if [ -n "$status" ]; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose ps -q $service) 2>/dev/null)
        if [ "$health" = "healthy" ]; then
            echo -e "✅ ${GREEN}$service: HEALTHY${NC}"
            return 0
        elif [ "$health" = "unhealthy" ]; then
            echo -e "❌ ${RED}$service: UNHEALTHY${NC}"
            return 1
        else
            echo -e "⚠️  ${YELLOW}$service: RUNNING (no health check)${NC}"
            return 0
        fi
    else
        echo -e "❌ ${RED}$service: NOT RUNNING${NC}"
        return 1
    fi
}

# Função para verificar jobs no Redis
check_redis_jobs() {
    echo ""
    echo "🔴 Status das Filas Redis:"
    echo "-------------------------"
    
    # Verificar filas
    local queues=("high" "default" "background")
    for queue in "${queues[@]}"; do
        local count=$(docker-compose exec -T redis redis-cli -a redis_secure_pass llen "queues:$queue" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo -e "📋 Fila $queue: ${YELLOW}$count jobs pendentes${NC}"
        else
            echo -e "📋 Fila $queue: ${GREEN}sem jobs pendentes${NC}"
        fi
    done
    
    # Verificar jobs com falha
    local failed=$(docker-compose exec -T redis redis-cli -a redis_secure_pass llen "queues:failed" 2>/dev/null || echo "0")
    if [ "$failed" -gt 0 ]; then
        echo -e "❌ Jobs com falha: ${RED}$failed${NC}"
    else
        echo -e "✅ Jobs com falha: ${GREEN}0${NC}"
    fi
}

# Função para verificar processos Laravel
check_laravel_processes() {
    echo ""
    echo "🔧 Processos Laravel:"
    echo "--------------------"
    
    # Verificar workers de fila
    local queue_workers=$(docker-compose exec -T app ps aux | grep -c "queue:work" || echo "0")
    echo -e "👷 Queue Workers: ${GREEN}$queue_workers ativos${NC}"
    
    # Verificar schedule
    local schedule_running=$(docker-compose exec -T schedule ps aux | grep -c "schedule:run" || echo "0")
    if [ "$schedule_running" -gt 0 ]; then
        echo -e "⏰ Schedule: ${GREEN}ativo${NC}"
    else
        echo -e "⏰ Schedule: ${RED}inativo${NC}"
    fi
}

# Função para verificar uso de recursos
check_resources() {
    echo ""
    echo "💻 Uso de Recursos:"
    echo "------------------"
    
    # Memory usage do Redis
    local redis_memory=$(docker-compose exec -T redis redis-cli -a redis_secure_pass info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' 2>/dev/null)
    echo -e "🔴 Redis Memory: ${YELLOW}$redis_memory${NC}"
    
    # MySQL connections
    local mysql_connections=$(docker-compose exec -T db mysql -u brunocakes -pbrunocakes_secure_pass -e "SHOW STATUS LIKE 'Threads_connected';" | tail -1 | awk '{print $2}' 2>/dev/null)
    echo -e "🗃️  MySQL Connections: ${YELLOW}$mysql_connections${NC}"
}

# Verificar todos os serviços
echo "🔍 Verificando Serviços:"
echo "------------------------"

services=("app" "frontend" "webserver" "db" "redis" "queue" "queue-high" "queue-background" "schedule")
all_healthy=true

for service in "${services[@]}"; do
    if ! check_service $service; then
        all_healthy=false
    fi
done

check_redis_jobs
check_laravel_processes
check_resources

echo ""
echo "========================================"
if [ "$all_healthy" = true ]; then
    echo -e "🎉 ${GREEN}Sistema BrunoCakes: OPERACIONAL${NC}"
    exit 0
else
    echo -e "⚠️  ${RED}Sistema BrunoCakes: COM PROBLEMAS${NC}"
    exit 1
fi