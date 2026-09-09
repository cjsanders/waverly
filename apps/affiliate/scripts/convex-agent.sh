#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/check-agent-env.sh

# Explicit values take precedence over Convex's dotenv loading. Unsetting these
# is insufficient because the CLI then reloads them from .env.local.
export CONVEX_AGENT_MODE=anonymous
export CONVEX_DEPLOY_KEY=
export CONVEX_DEPLOYMENT_TOKEN=
export CONVEX_SELF_HOSTED_ADMIN_KEY=
export CONVEX_SELF_HOSTED_URL=
export VITE_CONVEX_SITE_URL=
export VITE_CONVEX_URL=

config=.convex/local/default/config.json
if [[ -f "$config" ]]; then
  deployment_name="$(bun -e 'console.log(JSON.parse(await Bun.file(process.argv[1]).text()).deploymentName)' "$config")"
  export CONVEX_DEPLOYMENT="anonymous:$deployment_name"
else
  export CONVEX_DEPLOYMENT=
fi

exec bunx convex "$@"
