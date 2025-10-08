#!/bin/sh

echo "🛑 Parando sistema BrunoCakes..."

# Parar todos os containers
docker-compose down

echo "🧹 Limpando recursos Docker (opcional)..."
printf "Deseja limpar volumes e imagens não utilizadas? (s/N): "
read REPLY
echo
if [ "$REPLY" = "s" ] || [ "$REPLY" = "S" ]; then
    echo "🗑️ Removendo volumes..."
    docker-compose down -v

    echo "🗑️ Limpando imagens não utilizadas..."
    docker system prune -f

    echo "✅ Limpeza concluída!"
else
    echo "✅ Sistema parado (volumes preservados)"
fi