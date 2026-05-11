#!/usr/bin/env bash
# =============================================================================
# deploy_ec2.sh — One-command deploy for Ubuntu EC2
#
# Usage:
#   1) cp .env.example .env
#   2) nano .env   ← fill DOMAIN, LETSENCRYPT_EMAIL, secrets
#   3) sudo ./deploy_ec2.sh
#
# What this script does (idempotent — safe to run multiple times):
#   • Installs Docker + Certbot if not present
#   • Requests Let's Encrypt HTTPS cert (skips if cert already exists & valid)
#   • Creates /etc/letsencrypt/live/hotel symlink expected by nginx-gateway.conf
#   • Builds & starts all Docker services via docker compose
#   • Prints health status at the end
# =============================================================================
set -euo pipefail

# ── Root check ──────────────────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo "❌  Run with sudo: sudo ./deploy_ec2.sh"
  exit 1
fi

# ── .env check ──────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "❌  .env not found. Copy .env.example and fill in values first:"
  echo "    cp .env.example .env && nano .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source ./.env
set +a

if [ -z "${DOMAIN:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
  echo "❌  DOMAIN and LETSENCRYPT_EMAIL must be set in .env"
  exit 1
fi

echo "======================================================================"
echo "  Deploying hotel app → https://${DOMAIN}"
echo "======================================================================"

# ── 1. Install Docker (skip if already installed) ───────────────────────────
if ! command -v docker &>/dev/null; then
  echo "→ Installing Docker..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg lsb-release
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  echo "✓ Docker installed"
else
  echo "✓ Docker already installed ($(docker --version))"
fi

# Allow ubuntu user to use docker without sudo
if id ubuntu &>/dev/null; then
  usermod -aG docker ubuntu 2>/dev/null || true
fi

# ── 2. Install Certbot (skip if already installed) ──────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "→ Installing Certbot..."
  apt-get install -y -qq certbot
  echo "✓ Certbot installed"
else
  echo "✓ Certbot already installed"
fi

# ── 3. Obtain / renew Let's Encrypt certificate ─────────────────────────────
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

if [ -f "$CERT_PATH" ]; then
  echo "→ Cert already exists. Checking expiry..."
  EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
  echo "  Cert expires: $EXPIRY"
  # Renew if within 30 days
  if ! openssl x509 -checkend $((30*86400)) -noout -in "$CERT_PATH" &>/dev/null; then
    echo "→ Cert expiring soon. Stopping nginx (if running) for renewal..."
    docker compose stop nginx 2>/dev/null || true
    certbot renew --standalone --non-interactive
    docker compose start nginx 2>/dev/null || true
  else
    echo "✓ Cert is valid. Skipping renewal."
  fi
else
  echo "→ Requesting new Let's Encrypt certificate for ${DOMAIN}..."
  echo "  ⚠  Port 80 must be open and not in use."

  # Stop any running nginx container so port 80 is free for certbot standalone
  docker compose stop nginx 2>/dev/null || true

  certbot certonly --standalone \
    -d "${DOMAIN}" \
    -m "${LETSENCRYPT_EMAIL}" \
    --agree-tos \
    --non-interactive \
    --cert-name "${DOMAIN}" \
    --preferred-challenges http

  echo "→ Testing certificate auto-renewal..."
  certbot renew --dry-run --quiet
  echo "✓ Certificate obtained & renewal test passed."
fi

# ── 4. Create symlink /etc/letsencrypt/live/hotel → live/<domain> ────────────
# nginx-gateway.conf references the fixed name "hotel" so the config never
# needs to change regardless of which domain is used.
SYMLINK="/etc/letsencrypt/live/hotel"
if [ ! -e "$SYMLINK" ]; then
  ln -s "/etc/letsencrypt/live/${DOMAIN}" "$SYMLINK"
  echo "✓ Created symlink: $SYMLINK → /etc/letsencrypt/live/${DOMAIN}"
elif [ "$(readlink "$SYMLINK")" != "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "⚠  Symlink $SYMLINK points to $(readlink "$SYMLINK"), expected /etc/letsencrypt/live/${DOMAIN}"
  echo "   Remove it manually if needed: rm $SYMLINK"
else
  echo "✓ Symlink $SYMLINK already correct."
fi

# ── 5. Build & start Docker Compose stack ───────────────────────────────────
echo "→ Building images and starting services..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 6. Wait for services to be healthy ──────────────────────────────────────
echo "→ Waiting for services to start (30s)..."
sleep 30

echo ""
echo "======================================================================"
echo "  Service status"
echo "======================================================================"
docker compose ps

echo ""
echo "→ Quick health check..."

# Check backend is reachable through nginx
HTTP_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/actuator/health" || echo "unreachable")
echo "  Backend (/api/actuator/health): ${HTTP_STATUS}"

FRONTEND_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/" || echo "unreachable")
echo "  Frontend (/):                   ${FRONTEND_STATUS}"

echo ""
echo "======================================================================"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
  echo "  ✅  Deploy successful! App live at: https://${DOMAIN}"
else
  echo "  ⚠  Deploy done but health check returned: ${HTTP_STATUS}"
  echo "     Check logs: docker compose logs --tail=50"
fi
echo "======================================================================"

# ── 7. Set up automatic cert renewal via cron ────────────────────────────────
CRON_JOB="0 3 * * * certbot renew --quiet --deploy-hook 'docker compose -f $(pwd)/docker-compose.yml restart nginx'"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  echo "✓ Cron job added for certificate auto-renewal (daily 3AM)"
fi