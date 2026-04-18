#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="${1:-backend}"

echo "[Layer1] Starting Layer 1 integration tests..."

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Layer 1 integration tests FAILED"
  echo "Docker CLI is not installed or not on PATH."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Layer 1 integration tests FAILED"
  echo "Docker daemon is not running. Please start Docker."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_PATH="${ROOT_DIR}/${BACKEND_DIR}"

if [[ ! -d "${BACKEND_PATH}" ]]; then
  echo "❌ Layer 1 integration tests FAILED"
  echo "Backend directory not found: ${BACKEND_PATH}"
  exit 1
fi

cd "${BACKEND_PATH}"

if [[ -x "./mvnw" ]]; then
  ./mvnw -Dtest=BookingPaymentRoomFlowL1Test,AuthAndSecurityFlowL1Test test
else
  mvn -Dtest=BookingPaymentRoomFlowL1Test,AuthAndSecurityFlowL1Test test
fi

echo "✅ Layer 1 integration tests PASSED"
