#!/bin/bash

# ============================================================================
# RESTORE COMPLETO - seu_delivery
# Restaura bancos de dados, volumes Docker e código a partir de um backup
# ============================================================================

set -e

BACKUP_DIR="./backups"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  RESTORE COMPLETO - seu_delivery${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Listar backups disponíveis
echo -e "${BLUE}ℹ Backups disponíveis:${NC}"
if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR"/backup_*.tar.gz 2>/dev/null)" ]; then
  echo -e "${RED}✗ Nenhum backup encontrado em $BACKUP_DIR${NC}"
  exit 1
fi

ls -lh "$BACKUP_DIR"/backup_*.tar.gz | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Perguntar qual backup usar
read -p "Digite o nome do arquivo de backup (ou caminho completo): " BACKUP_FILE

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}✗ Arquivo não encontrado: $BACKUP_FILE${NC}"
  exit 1
fi

# Confirmação
echo ""
echo -e "${YELLOW}⚠ ATENÇÃO: Isso irá restaurar TODO O SISTEMA${NC}"
echo -e "${YELLOW}  - Sobrescrever banco de dados${NC}"
echo -e "${YELLOW}  - Restaurar volumes Docker${NC}"
echo -e "${YELLOW}  - Atualizar código do projeto${NC}"
echo ""
read -p "Tem certeza? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo -e "${BLUE}Operação cancelada${NC}"
  exit 0
fi

echo ""
echo -e "${BLUE}ℹ Parando containers...${NC}"
docker compose down 2>/dev/null || true

# Restaurar código
echo -e "${BLUE}ℹ Restaurando código...${NC}"
cd /srv
tar -xzf "$BACKUP_FILE" || {
  echo -e "${RED}✗ Erro ao extrair backup${NC}"
  exit 1
}
cd seu_delivery

# Restaurar banco de dados no container db compartilhado
echo -e "${BLUE}ℹ Aguardando MySQL ficar disponível...${NC}"
until docker exec db mysqladmin ping -h localhost -uroot -paligayra658691 &>/dev/null; do
  sleep 2
  echo -n "."
done
echo ""

echo -e "${BLUE}ℹ Restaurando banco de dados...${NC}"
DB_FILE=$(ls -t "$BACKUP_DIR"/db/seu_delivery_*.sql 2>/dev/null | head -1)
if [ -f "$DB_FILE" ]; then
  docker exec -i db mysql -uroot -paligayra658691 seu_delivery < "$DB_FILE" || {
    echo -e "${RED}✗ Erro ao restaurar banco de dados${NC}"
    exit 1
  }
  echo -e "${GREEN}✓ Banco de dados restaurado${NC}"
else
  echo -e "${YELLOW}⚠ Nenhum arquivo de banco de dados encontrado${NC}"
fi

# Iniciar todos os containers
echo -e "${BLUE}ℹ Iniciando todos os serviços...${NC}"
docker compose up -d || true

echo ""
echo -e "${GREEN}✓ RESTORE CONCLUÍDO COM SUCESSO!${NC}"
echo ""
echo -e "Verifique o status com: ${BLUE}docker compose ps${NC}"
echo ""
