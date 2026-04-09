#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PATH="${BACKEND_PATH:-/api/chat}"

collect_ips() {
  if command -v hostname >/dev/null 2>&1; then
    local hostname_ips
    hostname_ips="$(hostname -I 2>/dev/null || true)"
    if [[ -n "${hostname_ips}" ]]; then
      tr ' ' '\n' <<<"${hostname_ips}" | awk 'NF'
      return
    fi
  fi

  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig | awk '
      /inet / {
        ip = $2
        if (ip != "127.0.0.1") {
          print ip
        }
      }
    ' | sort -u
  fi
}

print_urls() {
  local ips=()
  while IFS= read -r ip; do
    [[ -n "${ip}" ]] && ips+=("${ip}")
  done < <(collect_ips)

  echo "Frontend:"
  echo "  Local:   http://localhost:${FRONTEND_PORT}"

  if ((${#ips[@]} > 0)); then
    for ip in "${ips[@]}"; do
      echo "  Network: http://${ip}:${FRONTEND_PORT}"
    done
  fi

  echo
  echo "Backend (Next.js API route on the same server):"
  echo "  Local:   http://localhost:${FRONTEND_PORT}${BACKEND_PATH}"

  if ((${#ips[@]} > 0)); then
    for ip in "${ips[@]}"; do
      echo "  Network: http://${ip}:${FRONTEND_PORT}${BACKEND_PATH}"
    done
  fi

  echo
  echo "Stop with Ctrl+C"
}

print_urls

exec "${ROOT_DIR}/scripts/with-root-env.sh" \
  pnpm --filter web exec next dev --hostname "${HOST}" --port "${FRONTEND_PORT}"
