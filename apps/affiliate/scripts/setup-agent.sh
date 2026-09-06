#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/check-agent-env.sh

if [[ ! -f .env.local ]]; then
  cp -- .env.example .env.local
  echo "[agent-setup] Created .env.local from its template"
fi

convex_url="$(sed -n 's/^VITE_CONVEX_URL=//p' .env.local | tail -1)"
case "$convex_url" in
  "" | http://127.0.0.1:* | http://localhost:*) ;;
  *)
    echo "[agent-setup] Refusing to replace the non-local Convex deployment in .env.local" >&2
    exit 1
    ;;
esac

workos_key=".workos-emulate/signing-key.pem"
if [[ ! -f "$workos_key" ]]; then
  if ! command -v openssl >/dev/null; then
    echo "[agent-setup] openssl is required to generate the local WorkOS signing key" >&2
    exit 1
  fi

  echo "[agent-setup] Generating the local WorkOS signing key"
  mkdir -p "$(dirname "$workos_key")"
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$workos_key" 2>/dev/null
  chmod 0600 "$workos_key"
fi

convex_config=".convex/local/default/config.json"
if [[ ! -f "$convex_config" ]]; then
  echo "[agent-setup] Initializing the anonymous local Convex deployment"
  ./scripts/convex-agent.sh init
fi

if [[ ! -f "$convex_config" ]]; then
  echo "[agent-setup] Convex did not create a local deployment" >&2
  exit 1
fi

echo "[agent-setup] Configuring the local Convex deployment"
printf '%s' 'client_waverly_local' | ./scripts/convex-agent.sh env set WORKOS_CLIENT_ID
printf '%s' 'http://127.0.0.1:4100' | ./scripts/convex-agent.sh env set WORKOS_API_URL

if curl -fsS -o /dev/null http://127.0.0.1:3210; then
  echo "[agent-setup] The local Convex backend is already running"
else
  ./scripts/convex-agent.sh dev --once
fi

echo "[agent-setup] Local WorkOS and Convex state is ready"
