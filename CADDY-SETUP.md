# Настройка панели за Caddy (panel.harmonymeditation.online)

Домен **panel.harmonymeditation.online** с автоматическим HTTPS и заголовками безопасности.

---

## 1. Проверка пути к панели

Сборка панели должна лежать в каталоге, с которого Caddy отдаёт файлы. У вас на сервере это, скорее всего:

```text
/root/panel-harmony/dist
```

Проверьте, что там есть файлы:

```bash
ls -la /root/panel-harmony/dist
# Должны быть index.html, assets/ и т.д.
```

---

## 2. Установка Caddy (если ещё не стоит)

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy
systemctl enable caddy
```

---

## 3. Конфиг Caddy

Создайте или отредактируйте Caddyfile. Обычно он лежит здесь: `/etc/caddy/Caddyfile`.

```bash
nano /etc/caddy/Caddyfile
```

Вставьте (или добавьте блок для панели):

```caddyfile
panel.harmonymeditation.online {
    root * /root/panel-harmony/dist
    try_file {path} /index.html
    file_server

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        X-XSS-Protection "1; mode=block"
        Permissions-Policy "geolocation=(), microphone=(), camera=()"
        -Server
    }

    log {
        output file /var/log/caddy/panel-harmony.log
        format json
    }
    encode gzip zstd
}
```

Если панель лежит не в `/root/panel-harmony/dist`, замените этот путь на свой в строке `root * ...`.

Проверка конфига:

```bash
caddy validate --config /etc/caddy/Caddyfile
```

Перезапуск Caddy:

```bash
systemctl reload caddy
# или
systemctl restart caddy
```

---

## 4. DNS

У домена **panel.harmonymeditation.online** должна быть A-запись на IP вашего сервера:

| Тип | Имя  | Значение    | TTL |
|-----|------|-------------|-----|
| A   | panel| IP сервера  | 300 |

Проверка (с вашего ПК):

```bash
nslookup panel.harmonymeditation.online
```

---

## 5. Порты

- Caddy по умолчанию слушает **80** (HTTP) и **443** (HTTPS).
- Убедитесь, что фаервол разрешает входящие 80 и 443:

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
ufw status
```

---

## 6. Что даёт эта настройка

| Что              | Как |
|------------------|-----|
| HTTPS            | Caddy сам получает сертификат Let's Encrypt для panel.harmonymeditation.online и продлевает его. |
| Без HTTP         | Caddy по умолчанию перенаправляет HTTP → HTTPS. |
| Заголовки        | Защита от вложения в iframe, от подмены MIME, от XSS, скрыт заголовок `Server`. |
| SPA              | Все неизвестные пути отдаются как `index.html` (работает клиентский роутинг). |
| Логи             | Доступ в `/var/log/caddy/panel-harmony.log` (при включённом `log`). |
| Сжатие           | Ответы сжимаются (gzip/zstd). |

---

## 7. Дополнительная защита (по желанию)

- **Ограничение по IP** (если панель только для своих):

```caddyfile
panel.harmonymeditation.online {
    @blocked not remote_ip 1.2.3.4 5.6.7.8
    respond @blocked 403
    # ... остальной конфиг
}
```

- **Базовая авторизация** — ставите плагин caddy-auth-portal или проксируете панель через бэкенд с логином.

После любых правок в Caddyfile:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```
