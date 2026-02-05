#!/bin/bash
set -e

echo "Rebuilding frontend-prod..."
cd /srv/Bruno_Cakes_filial
docker-compose build --no-cache frontend-prod
docker-compose up -d frontend-prod

echo ""
echo "Rebuilding frontend-dev..."
docker-compose build --no-cache frontend-dev  
docker-compose up -d frontend-dev

echo ""
echo "Done! Containers rebuilded."
docker-compose ps | grep frontend
