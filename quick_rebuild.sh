#!/bin/bash
set -e

cd /srv/seu_delivery

echo "Rebuilding seu_delivery_frontend_prod..."
docker compose build --no-cache seu_delivery_frontend_prod
docker compose up -d seu_delivery_frontend_prod

echo ""
echo "Rebuilding seu_delivery_frontend_dev..."
docker compose build --no-cache seu_delivery_frontend_dev
docker compose up -d seu_delivery_frontend_dev

echo ""
echo "Done! Containers rebuilded."
docker compose ps | grep frontend
