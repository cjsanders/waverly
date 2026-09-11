#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <website|docs|affiliate> -- <command>..." >&2
  exit 1
}

app="${1:-}"
shift || usage
case "$app" in
  website | docs | affiliate) ;;
  *) usage ;;
esac
[[ "${1:-}" == "--" ]] || usage
shift
[[ $# -gt 0 ]] || usage

root="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.bun/bin:/usr/local/bin:${PATH}"

case "$app" in
  website) token="${DOPPLER_TOKEN_WEBSITE:-}" ;;
  docs) token="${DOPPLER_TOKEN_DOCS:-}" ;;
  affiliate) token="${DOPPLER_TOKEN_AFFILIATE:-}" ;;
esac

cd "$root/apps/$app"

if command -v doppler >/dev/null 2>&1 && [[ -n "$token" ]]; then
  exec env DOPPLER_TOKEN="$token" doppler run -- "$@"
fi

exec "$@"
