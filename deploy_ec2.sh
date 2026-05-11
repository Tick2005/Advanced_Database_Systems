#!/usr/bin/env bash
set -euo pipefail

# Deploy helper for Ubuntu EC2
# Usage:
#   1) cp .env.example .env && edit DOMAIN + LETSENCRYPT_EMAIL
#   2) sudo ./deploy_ec2.sh

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing .env file. Please create it from .env.example first."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

if [ -z "${DOMAIN:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "DOMAIN and LETSENCRYPT_EMAIL are required in .env"
  exit 1
fi

apt update
apt install -y ca-certificates curl gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
apt install -y certbot

# Allow current user (ubuntu) to use docker without sudo
if id ubuntu &>/dev/null; then
  usermod -aG docker ubuntu || true
fi

echo "Requesting Let's Encrypt certificate (standalone)..."
certbot certonly --standalone \
  -d "${DOMAIN}" \
  -m "${LETSENCRYPT_EMAIL}" \
  --agree-tos \
  --non-interactive \
  --cert-name "hotel" \
  --preferred-challenges http

echo "Testing automatic certificate renewal..."
certbot renew --dry-run

if [ ! -e /etc/letsencrypt/live/hotel ]; then
  ln -s "/etc/letsencrypt/live/${DOMAIN}" /etc/letsencrypt/live/hotel
fi

echo "Starting Docker stack..."
docker compose pull || true
docker compose up -d --build

echo "Done. HTTPS is configured for ${DOMAIN} via dockerized nginx."
echo "Check services: docker compose ps"
