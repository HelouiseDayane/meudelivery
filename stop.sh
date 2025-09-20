#!/bin/bash

echo "🛑 Parando sistema BrunoCakes..."

# Parar todos os containers
docker-compose down

echo "🧹 Limpando recursos Docker (opcional)..."
read -p "Deseja limpar volumes e imagens não utilizadas? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️ Removendo volumes..."
    docker-compose down -v
    
    echo "🗑️ Limpando imagens não utilizadas..."
    docker system prune -f
    
    echo "✅ Limpeza concluída!"
else
    echo "✅ Sistema parado (volumes preservados)"
fi