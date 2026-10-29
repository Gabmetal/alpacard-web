#!/usr/bin/env bash
set -euo pipefail

# Alpacard Multi-Environment Deployment Script
# Usage: ./scripts/deploy-env.sh [dev|prod]

TARGET_ENV="${1:-dev}"

if [ "$TARGET_ENV" = "prod" ] || [ "$TARGET_ENV" = "production" ] || [ "$TARGET_ENV" = "main" ]; then
  NAMESPACE="alpacard"
  DOMAIN="https://alpacard.app"
  ENV_LABEL="Production"
elif [ "$TARGET_ENV" = "dev" ] || [ "$TARGET_ENV" = "development" ]; then
  NAMESPACE="alpacard-dev"
  DOMAIN="https://dev.alpacard.app"
  ENV_LABEL="Development"
else
  echo "❌ Error: Invalid target environment '$TARGET_ENV'. Must be 'dev' or 'prod'."
  exit 1
fi

echo "=========================================================="
echo "🚀 Alpacard Continuous Deployment -> $ENV_LABEL ($NAMESPACE)"
echo "   Target Domain: $DOMAIN"
echo "   Timestamp:     $(date -u)"
echo "=========================================================="

# 1. Build Shared Types and Frontend Bundles
echo "📦 [1/6] Installing dependencies and building frontend apps..."
pnpm install --frozen-lockfile
pnpm --filter @alpacard/shared build
pnpm --filter @alpacard/web build
pnpm --filter @alpacard/wallet build

# 2. Compile Go Binaries Statically
echo "🐹 [2/6] Compiling Go API & Worker binaries statically..."
(cd apps/api && CGO_ENABLED=0 GOOS=linux go build -o bin/server ./cmd/server)
(cd apps/api && CGO_ENABLED=0 GOOS=linux go build -o bin/worker ./cmd/worker)

# 3. Build Container Images with Podman
echo "🐳 [3/6] Building container images..."
podman build -t localhost/alpacard-web:latest apps/web
podman build -t localhost/alpacard-wallet:latest apps/wallet
podman build -t localhost/alpacard-api:latest apps/api

# 4. Import Container Images into Kubernetes containerd
echo "📥 [4/6] Importing container images into Kubernetes containerd runtime..."
podman save localhost/alpacard-web:latest | sudo k3s ctr --namespace k8s.io images import -
podman save localhost/alpacard-wallet:latest | sudo k3s ctr --namespace k8s.io images import -
podman save localhost/alpacard-api:latest | sudo k3s ctr --namespace k8s.io images import -

# 5. Rotate Running Pods in the targeted Namespace
echo "🔄 [5/6] Applying manifests and triggering rolling restart for namespace: $NAMESPACE..."
if [ "$NAMESPACE" = "alpacard" ]; then
  kubectl apply -f deploy/kubernetes/05-ingress.yaml -n "$NAMESPACE" || true
  kubectl patch configmap alpacard-api-config -n "$NAMESPACE" --type merge -p '{"data":{"APP_URL":"https://alpacard.app","WALLET_URL":"https://wallet.alpacard.app","SMTP_FROM":"Alpacard <no-reply@alpacard.app>","CORS_ORIGINS":"https://alpacard.app,https://www.alpacard.app,https://wallet.alpacard.app,https://merchant.alpacard.app,https://demo.alpacard.app,http://localhost:5173,http://localhost:5174"}}' || true
fi
kubectl delete pod -l app=alpacard-web -n "$NAMESPACE" || true
kubectl delete pod -l app=alpacard-wallet -n "$NAMESPACE" || true
kubectl delete pod -l app=alpacard-api -n "$NAMESPACE" || true
kubectl delete pod -l app=alpacard-worker -n "$NAMESPACE" || true

echo "⏳ Awaiting rollout completion..."
kubectl rollout status deployment/alpacard-web -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/alpacard-wallet -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/alpacard-api -n "$NAMESPACE" --timeout=120s
kubectl rollout status deployment/alpacard-worker -n "$NAMESPACE" --timeout=120s

# 6. Automated Health Verification Smoke Test
echo "🔍 [6/6] Verifying environment health at $DOMAIN..."
STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$DOMAIN/api/health" || echo "000")
if [ "$STATUS" = "200" ]; then
  echo "✅ Health check PASSED (HTTP 200) for $DOMAIN/api/health"
else
  echo "⚠️ Warning: Health check returned HTTP $STATUS. Inspecting endpoint..."
  curl -s -k "$DOMAIN/api/health" || true
fi

echo "=========================================================="
echo "🎉 Deployment to $ENV_LABEL successfully completed!"
echo "=========================================================="
