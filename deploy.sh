#!/bin/bash

# Deploy manual - sincroniza arquivos para o servidor
# Execute quando quiser enviar mudanças

echo "🚀 Deploy Manual para Bruno Cakes"
echo ""
echo "⚠️  Você precisará digitar 2 senhas:"
echo "   1ª: GatoPreto11."
echo "   2ª: .\$PWG305408"
echo ""

rsync -avz --progress --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'vendor' \
  --exclude 'storage/logs/*' \
  --exclude 'storage/framework/cache/*' \
  --exclude 'storage/framework/sessions/*' \
  --exclude 'storage/framework/views/*' \
  --exclude 'deploy-auto.sh' \
  --exclude 'deploy.sh' \
  --exclude 'watch-deploy.sh' \
  --exclude 'watch-deploy-simple.sh' \
  "/home/helouisedayane/Documentos/Bruno_Cakes_filial/" \
  SERVER01:/srv/Bruno_Cakes_filial/

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deploy concluído com sucesso!"
  echo ""
  echo "📝 Próximos passos no servidor:"
  echo "   ssh SERVER01"
  echo "   cd /srv/Bruno_Cakes_filial"
  echo "   ./start.sh"
else
  echo ""
  echo "❌ Deploy falhou!"
fi
