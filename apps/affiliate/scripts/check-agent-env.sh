#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

for file in .dev.vars.dev .dev.vars; do
  if [[ -f "$file" ]]; then
    echo "[agent-env] $file overrides the isolated WorkOS settings. Move it aside before running the agent stack." >&2
    exit 1
  fi
done

for file in .env.local .env; do
  [[ -f "$file" ]] || continue

  while IFS= read -r assignment; do
    name="${assignment%%=*}"
    name="${name#export }"
    value="${assignment#*=}"
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"

    [[ -z "$value" ]] && continue

    case "$name:$value" in
      CONVEX_DEPLOYMENT:anonymous:* | VITE_CONVEX_URL:http://127.0.0.1:* | VITE_CONVEX_URL:http://localhost:* | VITE_CONVEX_SITE_URL:http://127.0.0.1:* | VITE_CONVEX_SITE_URL:http://localhost:*)
        ;;
      *)
        echo "[agent-env] $file contains $name for a non-agent backend. Move it aside before running the isolated agent stack." >&2
        exit 1
        ;;
    esac
  done < <(
    grep -E '^(export )?(CONVEX_DEPLOY_KEY|CONVEX_DEPLOYMENT|CONVEX_DEPLOYMENT_TOKEN|CONVEX_SELF_HOSTED_ADMIN_KEY|CONVEX_SELF_HOSTED_URL|VITE_CONVEX_SITE_URL|VITE_CONVEX_URL)=' "$file" || true
  )
done
