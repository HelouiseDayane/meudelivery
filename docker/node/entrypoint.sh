#!/bin/sh

echo "🚀 Iniciando setup do Frontend React..."

cd /usr/src/app

# Instalar dependências se não existirem
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do npm..."
    npm install --silent
fi

echo "✅ Setup do frontend concluído!"

# Executar comando passado como argumento
exec "$@"