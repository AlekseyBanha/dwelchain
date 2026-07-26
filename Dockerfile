# ============================================================
# Dockerfile — образ PHP-приложения (FrankenPHP)
# ============================================================
# Multi-stage сборка по аналогии с crm-rent.
# База: dunglas/frankenphp (Caddy + PHP в одном процессе).
# PHP 8.4 — требование Symfony 8.x / Laravel 13.
#
# Порт: Caddyfile слушает :{$PORT:80}.
#   Локально — PORT=80 (compose).
#   Render  — платформа подставляет PORT (обычно 10000).
#
# Targets:
#   builder          — общие PHP-расширения + composer
#   php-franken      — production: код + composer --no-dev
#   php-franken-dev  — development: без копирования кода
#                        (код монтируется volume'ом)
# ============================================================

FROM dunglas/frankenphp:php8.4-alpine AS builder

# PHP-расширения, нужные Laravel + PostgreSQL
RUN install-php-extensions \
  opcache \
  sockets \
  sodium \
  pgsql \
  pdo_pgsql \
  zip \
  mbstring \
  curl \
  intl

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# Убираем дефолтный public из образа frankenphp
RUN rm -rf /app/public

COPY ./docker-files/php/config/php.ini $PHP_INI_DIR/php.ini

# Caddyfile: listen on :{$PORT:80} (Render sets PORT at runtime; local default 80).
# Do NOT bake SERVER_NAME=:${PORT} via ENV — Docker expands it at build time only.
COPY ./docker-files/php/Caddyfile /etc/caddy/Caddyfile

# ---------- production ----------
FROM builder AS php-franken

ENV GOMAXPROCS=5

COPY . /app
RUN /usr/local/bin/composer install --prefer-dist --no-dev -o
RUN rm /usr/local/bin/composer

# ---------- development ----------
FROM builder AS php-franken-dev

ENV GOMAXPROCS=1
