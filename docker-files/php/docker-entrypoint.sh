#!/bin/sh
# ============================================================
# docker-entrypoint.sh — production start (Render / compose)
# ============================================================
# 1) migrate --force (APP_ENV=production блокує інтерактивні migrate)
# 2) frankenphp run (явний CMD — Render часто не передає args у ENTRYPOINT)
# ============================================================
set -e

cd /app

echo "Running database migrations..."
php artisan migrate --force

# Якщо CMD/args порожні (типово на Render) — стартуємо з нашим Caddyfile.
if [ "$#" -eq 0 ]; then
	set -- --config /etc/caddy/Caddyfile --adapter caddyfile
fi

echo "Starting FrankenPHP..."
exec docker-php-entrypoint "$@"
