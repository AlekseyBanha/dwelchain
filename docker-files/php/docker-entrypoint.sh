#!/bin/sh
# ============================================================
# docker-entrypoint.sh — production start (Render / compose)
# ============================================================
# 1) migrate --force (APP_ENV=production блокує інтерактивні migrate)
# 2) передати керування штатному docker-php-entrypoint → frankenphp
# ============================================================
set -e

cd /app

echo "Running database migrations..."
php artisan migrate --force

exec docker-php-entrypoint "$@"
