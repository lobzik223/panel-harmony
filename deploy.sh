#!/bin/bash
# Деплой панели Harmony на сервер
# Использование: ./deploy.sh   (читает .env.deploy если есть)
# Или: SERVER_HOST=my.server.com SERVER_USER=deploy SERVER_PATH=/var/www/panel ./deploy.sh

set -e
cd "$(dirname "$0")"

echo "=== Сборка панели ==="
npm run build

if [ -f .env.deploy ]; then
  set -a
  source .env.deploy
  set +a
fi

if [ -n "$SERVER_HOST" ] && [ -n "$SERVER_USER" ] && [ -n "$SERVER_PATH" ]; then
  echo "=== Загрузка на сервер ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH} ==="
  rsync -avz --delete dist/ "${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
  echo "Готово. Панель залита на сервер."
else
  echo "Переменные SERVER_HOST, SERVER_USER, SERVER_PATH не заданы."
  echo "Собранные файлы в папке: $(pwd)/dist"
  echo "Создайте .env.deploy по образцу .env.deploy.example для автоматической загрузки."
fi
