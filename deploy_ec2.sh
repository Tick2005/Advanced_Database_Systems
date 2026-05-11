#!/usr/bin/env bash
# =============================================================================
# deploy_ec2.sh — One-command deploy for Ubuntu EC2
#
# Usage:
#   1) cp .env.example .env
#   2) nano .env   ← fill DOMAIN, LETSENCRYPT_EMAIL, secrets
#   3) sudo ./deploy_ec2.sh
#
# Flow:
#   Install Docker & Certbot → Dừng toàn bộ docker → Lấy cert (port 80 free)
#   → Start Docker stack → Health check → Cron renewal
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
# QUAN TRỌNG: certbot --standalone cần port 80 trống.
# Dừng toàn bộ docker (kể cả nginx đang giữ port 80) TRƯỚC certbot.
# Docker sẽ được start lại ở bước 5 sau khi có cert.

CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
NEED_CERT=false

if [ -f "$CERT_PATH" ]; then
  echo "→ Cert already exists. Checking expiry..."
  EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
  echo "  Cert expires: $EXPIRY"
  if ! openssl x509 -checkend $((30*86400)) -noout -in "$CERT_PATH" &>/dev/null; then
    echo "→ Cert expiring soon — will renew."
    NEED_CERT=true
  else
    echo "✓ Cert valid. Skipping certbot."
  fi
else
  echo "→ No cert found — will request new one."
  NEED_CERT=true
fi

if [ "$NEED_CERT" = true ]; then
  echo "→ Stopping all docker containers to free port 80..."
  docker compose down 2>/dev/null || true

  # Đảm bảo port 80 thực sự trống
  if ss -tlnp | grep -q ':80 '; then
    echo "❌  Port 80 vẫn bị chiếm bởi tiến trình khác (không phải docker)."
    echo "   Kiểm tra: ss -tlnp | grep ':80'"
    exit 1
  fi

  echo "→ Requesting Let's Encrypt certificate for ${DOMAIN}..."
  certbot certonly --standalone \
    -d "${DOMAIN}" \
    -m "${LETSENCRYPT_EMAIL}" \
    --agree-tos \
    --non-interactive \
    --cert-name "${DOMAIN}" \
    --preferred-challenges http

  echo "✓ Certificate obtained."
fi

# ── 4. Symlink /etc/letsencrypt/live/hotel → live/<domain> ──────────────────
# nginx-gateway.conf dùng tên cố định "hotel" → không cần sửa config khi
# đổi domain.
SYMLINK="/etc/letsencrypt/live/hotel"
if [ ! -e "$SYMLINK" ]; then
  ln -s "/etc/letsencrypt/live/${DOMAIN}" "$SYMLINK"
  echo "✓ Created symlink: $SYMLINK → /etc/letsencrypt/live/${DOMAIN}"
elif [ "$(readlink "$SYMLINK")" != "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "⚠  Symlink $SYMLINK trỏ sai: $(readlink "$SYMLINK")"
  echo "   Xóa thủ công nếu cần: rm $SYMLINK"
else
  echo "✓ Symlink $SYMLINK đã đúng."
fi

# ── 5. Build & start Docker Compose stack ───────────────────────────────────
# Tới đây cert đã sẵn sàng → nginx start với SSL sẽ thành công
echo "→ Building images and starting services..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ── 6. Health check ─────────────────────────────────────────────────────────
echo "→ Waiting for services to start (30s)..."
sleep 30

echo ""
echo "======================================================================"
echo "  Service status"
echo "======================================================================"
docker compose ps

echo ""
echo "→ Quick health check..."
HTTP_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/actuator/health" || echo "unreachable")
echo "  Backend (/api/actuator/health): ${HTTP_STATUS}"

FRONTEND_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" "https://${DOMAIN}/" || echo "unreachable")
echo "  Frontend (/):                   ${FRONTEND_STATUS}"

echo ""
echo "======================================================================"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
  echo "  ✅  Deploy successful! App live at: https://${DOMAIN}"
else
  echo "  ⚠  Deploy done nhưng health check trả: ${HTTP_STATUS}"
  echo "     Kiểm tra logs: docker compose logs --tail=50"
fi
echo "======================================================================"

# ── 7. Cron + deploy-hook cho auto-renewal ───────────────────────────────────
# Dùng deploy-hook của certbot (chạy SAU khi renew thành công).
# Hook chỉ restart nginx — không down cả stack, không conflict port 80
# vì certbot renew dùng lại method cũ (standalone) chỉ khi cần.
# Để tránh hoàn toàn port conflict khi renew tự động, dùng --webroot
# hoặc DNS challenge. Ở đây dùng deploy-hook restart nginx là đủ an toàn
# vì certbot renew sẽ tự dừng/start standalone chỉ khi cert gần hết hạn.
DEPLOY_DIR="$(pwd)"
RENEW_HOOK="/etc/letsencrypt/renewal-hooks/deploy/restart-nginx.sh"

if [ ! -f "$RENEW_HOOK" ]; then
  mkdir -p "$(dirname "$RENEW_HOOK")"
  cat > "$RENEW_HOOK" <<HOOK
#!/usr/bin/env bash
# Tự động chạy sau khi certbot renew thành công
# Chỉ restart nginx để load cert mới, không ảnh hưởng backend/db
cd "${DEPLOY_DIR}"
docker compose restart nginx
HOOK
  chmod +x "$RENEW_HOOK"
  echo "✓ Renewal deploy-hook created: $RENEW_HOOK"
fi

# Cron: certbot renew mỗi ngày lúc 3AM
# Khi renew: certbot sẽ dừng nginx container (port 80 free) → lấy cert → hook restart nginx
CRON_CMD="0 3 * * * docker compose -f ${DEPLOY_DIR}/docker-compose.yml stop nginx && certbot renew --quiet && docker compose -f ${DEPLOY_DIR}/docker-compose.yml start nginx"
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
  (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
  echo "✓ Cron renewal added (daily 3AM):"
  echo "   Stop nginx → certbot renew → start nginx (không ảnh hưởng backend/db)"
fi