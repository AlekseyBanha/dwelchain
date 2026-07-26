#!/bin/bash
# ============================================================
# init-db.sh — первичная инициализация PostgreSQL
# ============================================================
# Выполняется ТОЛЬКО при первом создании volume postgres
# (каталог /var/lib/postgresql/data пуст).
#
# Переменные DB_* приходят из environment сервиса postgres
# (см. docker-compose.yaml → # first init vars).
# ============================================================

echo "Running init-db.sh"

echo "Creating USER"
psql -U "postgres" -c "CREATE USER $DB_USERNAME WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

echo "Creating DATABASE"
psql -U "postgres" -c "CREATE DATABASE $DB_DATABASE;"
psql -U "postgres" -c "ALTER DATABASE $DB_DATABASE OWNER TO $DB_USERNAME;"

echo "Creating PRIVILEGES"
psql -U "postgres" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_DATABASE TO $DB_USERNAME;"

echo "Creating uuid-ossp extension"
psql -U "postgres" -d "$DB_DATABASE" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

echo "Finished running init-db.sh"
