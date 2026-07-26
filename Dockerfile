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
# Render / restricted runtimes: официальный образ вешает на
# frankenphp file-capability CAP_NET_BIND_SERVICE. В sandbox
# Render execve такого бинарника даёт
#   "frankenphp: Operation not permitted" (exit 126).
# Поэтому capability снимаем (setcap -r) и слушаем $PORT > 1024.
#
# Targets:
#   builder          — общие PHP-расширения + composer
#   php-franken-dev  — development: без копирования кода
#                        (код монтируется volume'ом)
#   php-franken      — production (default / последний stage)
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

# Убрать CAP_NET_BIND_SERVICE — иначе Render не даёт exec frankenphp.
# Нужен unprivileged PORT (см. Caddyfile :{$PORT:80}).
RUN setcap -r /usr/local/bin/frankenphp

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# Убираем дефолтный public из образа frankenphp
RUN rm -rf /app/public

COPY ./docker-files/php/config/php.ini $PHP_INI_DIR/php.ini

# Caddyfile: listen on :{$PORT:80} (Render sets PORT at runtime; local default 80).
# Do NOT bake SERVER_NAME=:${PORT} via ENV — Docker expands it at build time only.
COPY ./docker-files/php/Caddyfile /etc/caddy/Caddyfile

# ---------- development ----------
FROM builder AS php-franken-dev

ENV GOMAXPROCS=1

# ---------- production (default stage for `docker build` / Render) ----------
FROM builder AS php-franken

ENV GOMAXPROCS=5

COPY . /app
RUN /usr/local/bin/composer install --prefer-dist --no-dev -o
RUN rm /usr/local/bin/composer
