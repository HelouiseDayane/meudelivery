#!/bin/bash
# Alterna ambiente do frontend entre produção e teste
# Uso: ./set-frontend-env.sh [producao|teste]

if [ "$1" == "producao" ]; then
  cp brunocakes_front_v3/.env.production brunocakes_front_v3/.env
  echo "Frontend configurado para PRODUÇÃO."
elif [ "$1" == "teste" ]; then
  cp brunocakes_front_v3/.env.local brunocakes_front_v3/.env
  echo "Frontend configurado para TESTE."
else
  echo "Uso: $0 [producao|teste]"
  exit 1
fi
