#!/bin/bash

# ============================================================================
# START - Bruno Cakes
# Cria containers, executa build em background (-d) e testa
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INICIANDO SISTEMA - Bruno Cakes${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Parar containers anteriores (se existirem)
echo -e "${BLUE}ℹ Limpando ambiente anterior...${NC}"
docker-compose down 2>/dev/null || true

# Build das imagens
echo -e "${BLUE}ℹ Construindo imagens Docker...${NC}"
docker-compose build --no-cache 2>&1 | grep -E "(Building|Successfully|error)" || true

# Iniciar containers em background
echo -e "${BLUE}ℹ Iniciando containers em background (-d)...${NC}"
docker-compose up -d

# Aguardar serviços ficarem prontos
echo -e "${BLUE}ℹ Aguardando serviços ficarem prontos...${NC}"

# Esperar MySQL
echo -n "  • MySQL: "
until docker-compose exec -T mysql mysqladmin ping -h localhost -u root -proot_pass &>/dev/null; do
  sleep 2
  echo -n "."
done
echo -e " ${GREEN}✓${NC}"

# Esperar Redis
echo -n "  • Redis: "
until docker-compose exec -T redis redis-cli -a cakes12345671571285415715715785421478214782171285742557 ping &>/dev/null; do
  sleep 2
  echo -n "."
done
echo -e " ${GREEN}✓${NC}"

# Esperar Backend
echo -n "  • Backend: "
until docker-compose exec -T backend php -v &>/dev/null; do
  sleep 2
  echo -n "."
done
echo -e " ${GREEN}✓${NC}"

# Criar banco de dados se necessário
echo -e "${BLUE}ℹ Verificando banco de dados...${NC}"
docker-compose exec backend php artisan migrate:fresh --seed 2>/dev/null || true

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ SISTEMA INICIADO COM SUCESSO!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

# Status dos containers
echo -e "${YELLOW}Status dos containers:${NC}"
docker-compose ps
echo ""

# Mostrar portas disponíveis
echo -e "${YELLOW}Serviços disponíveis:${NC}"
echo "  • Frontend (Teste):    https://localhost:8888"
echo "  • Frontend (Produção): https://localhost:9999"
echo "  • Backend:             http://localhost:8191"
echo ""

# Executar testes básicos
echo -e "${BLUE}ℹ Executando testes básicos...${NC}"

# Testar Backend
echo -n "  • Backend API: "
if curl -s http://localhost:8191/api/health >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠ (não respondeu)${NC}"
fi

# Testar Frontend Dev
echo -n "  • Frontend (Teste): "
if curl -s -k https://localhost:8888 >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠ (aguardando inicialização)${NC}"
fi

# Testar Frontend Prod
echo -n "  • Frontend (Produção): "
if curl -s -k https://localhost:9999 >/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${YELLOW}⚠ (aguardando inicialização)${NC}"
fi

echo ""
echo -e "${BLUE}ℹ Para ver os logs: ${NC}docker-compose logs -f${NC}"
echo ""
