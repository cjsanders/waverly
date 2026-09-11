#!/usr/bin/env bash
set -euo pipefail

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:/usr/local/bin:$PATH"

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash -s "bun-v1.3.10"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

if ! command -v doppler >/dev/null 2>&1; then
  curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sudo sh
fi

configure_app_token() {
  local app="$1"
  local token="$2"
  if [[ -z "$token" ]]; then
    return 0
  fi
  printf '%s' "$token" | doppler configure set token --scope "$root/apps/$app" --silent >/dev/null
}

configure_app_token website "${DOPPLER_TOKEN_WEBSITE:-}"
configure_app_token docs "${DOPPLER_TOKEN_DOCS:-}"
configure_app_token affiliate "${DOPPLER_TOKEN_AFFILIATE:-}"

bun install --frozen-lockfile
bun run setup:agent
