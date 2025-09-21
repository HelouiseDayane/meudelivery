#!/bin/bash

case "$1" in
  logs)
    docker-compose logs -f
    ;;
  status)
    docker-compose ps
    ;;
  artisan)
    docker-compose exec backend php artisan "${@:2}"
    ;;
  shell-backend)
    docker-compose exec backend bash
    ;;
  redis)
    docker-compose exec redis redis-cli -a redis_secure_pass
    ;;
  monitor)
    docker stats
    ;;
  health)
    docker-compose ps
    ;;
  queue-status)
    docker-compose exec backend php artisan queue:monitor
    ;;
  queue-restart)
    docker-compose exec backend php artisan queue:restart
    ;;
  queue-failed)
    docker-compose exec backend php artisan queue:failed
    ;;
  queue-retry)
    docker-compose exec backend php artisan queue:retry all
    ;;
  *)
    echo "Comando desconhecido"
    ;;
esac