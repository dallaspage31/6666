#!/usr/bin/env bash
set -euo pipefail

APP_NAME="robheroes"
DEPLOY_DIR="/var/www/${APP_NAME}"
DB_NAME="robheroes"
DB_USER="postgres"
DB_PASS="postgres"
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"
SYSTEMD_SERVICE="/etc/systemd/system/${APP_NAME}.service"
ENV_FILE="${DEPLOY_DIR}/.env.production"

echo "=== Robheroes Deploy Bootstrap ==="

if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" >&2
    exit 1
fi

echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq nginx postgresql curl ca-certificates git build-essential

echo "[2/8] Creating application user..."
if ! id "${APP_NAME}" &>/dev/null; then
    useradd --system --create-home --shell /bin/bash "${APP_NAME}"
fi

echo "[3/8] Creating deploy directory..."
mkdir -p "${DEPLOY_DIR}"
chown -R "${APP_NAME}:${APP_NAME}" "${DEPLOY_DIR}"

echo "[4/8] Setting up PostgreSQL..."
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
fi

echo "[5/8] Importing database schema..."
sudo -u postgres psql -d "${DB_NAME}" -f "${DEPLOY_DIR}/deploy/schema.sql"

echo "[6/8] Configuring Nginx..."
cp "${DEPLOY_DIR}/deploy/nginx.conf" "${NGINX_CONF}"
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx || systemctl start nginx

echo "[7/8] Configuring systemd service..."
cp "${DEPLOY_DIR}/deploy/robheroes.service" "${SYSTEMD_SERVICE}"
systemctl daemon-reload
systemctl enable "${APP_NAME}.service"

echo "[8/8] Building application..."
su - "${APP_NAME}" -c "cd ${DEPLOY_DIR} && npm ci && npm run build"

echo "=== Bootstrap complete ==="
echo "Review ${ENV_FILE} and run: systemctl start ${APP_NAME}"