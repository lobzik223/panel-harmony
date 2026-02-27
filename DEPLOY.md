# Загрузка панели Harmony на сервер

Репозиторий: **https://github.com/lobzik223/panel-harmony**

---

## Команды на сервере (Linux)

Подключитесь к серверу по SSH и выполните:

```bash
# Перейти в каталог для сайтов (или свой путь)
cd /var/www

# Клонировать репозиторий
git clone https://github.com/lobzik223/panel-harmony.git
cd panel-harmony

# Установить зависимости
npm install

# Задать URL бэкенда перед сборкой (иначе панель может обращаться к localhost)
# Для panel.harmonymeditation.online есть fallback на https://api.harmonymeditation.online
echo "VITE_API_URL=https://api.harmonymeditation.online" > .env

# Собрать панель
npm run build
```

После этого в папке `dist/` будет готовая статика. Укажите в Nginx `root /var/www/panel-harmony/dist;` (см. раздел про Nginx ниже) или скопируйте содержимое `dist/` в нужный каталог.

При обновлении панели на сервере:

```bash
cd /var/www/panel-harmony
git pull
npm install
npm run build
```

---

## 1. Сборка (локально)

В папке `panel-harmony` выполните:

```bash
npm run build
```

Готовые файлы появятся в папке **`dist/`**. Их нужно отдать веб-серверу (Nginx, Apache или хостинг вроде Vercel/Netlify).

## 2. Загрузка на свой сервер по SSH

### Вариант A: Windows (PowerShell)

1. Скопируйте пример настроек и укажите свой сервер:
   ```powershell
   copy .env.deploy.example .env.deploy
   # Отредактируйте .env.deploy: SERVER_HOST, SERVER_USER, SERVER_PATH
   ```

2. Запустите деплой (сборка + загрузка по SCP):
   ```powershell
   .\deploy.ps1
   ```

### Вариант B: Linux / macOS

1. Настройте переменные (можно в файле `.env.deploy` по образцу `.env.deploy.example`):
   - `SERVER_HOST` — хост или IP сервера
   - `SERVER_USER` — пользователь SSH
   - `SERVER_PATH` — каталог на сервере (должен существовать), например `/var/www/harmony-panel`

2. Запустите:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   Скрипт соберёт проект и загрузит содержимое `dist/` на сервер через `rsync`.

## 3. Настройка веб-сервера (Nginx)

Пример для отдачи статики из папки сборки (если клонировали в `/var/www/panel-harmony`):

```nginx
server {
    listen 80;
    server_name panel.your-domain.com;
    root /var/www/panel-harmony/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Перезапуск Nginx после правок: `sudo systemctl reload nginx`

**Используете Caddy?** Подробная настройка для домена **panel.harmonymeditation.online** (HTTPS, заголовки безопасности) — в файле **CADDY-SETUP.md** и пример конфига в **Caddyfile.example**.

## 4. Переменные для продакшена

Перед сборкой задайте URL бэкенда (в `.env` или в системе):

- `VITE_API_URL` — адрес API (например `https://api.your-domain.com`)
- При необходимости `VITE_APP_KEY` — ключ приложения, если его проверяет бэкенд

После изменения переменных выполните `npm run build` заново.
