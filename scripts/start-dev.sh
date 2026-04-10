#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-0.0.0.0}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PATH="${BACKEND_PATH:-/api/chat}"
FORCE_KILL_FRONTEND_PORT="${FORCE_KILL_FRONTEND_PORT:-0}"

find_port_listener_pids() {
  local port="$1"
  lsof -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null || true
}

command_for_pid() {
  local pid="$1"
  ps -p "${pid}" -o command= 2>/dev/null || true
}

cwd_for_pid() {
  local pid="$1"
  lsof -a -p "${pid}" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

pid_is_our_next_dev() {
  local pid="$1"
  local command cwd
  command="$(command_for_pid "${pid}")"
  cwd="$(cwd_for_pid "${pid}")"

  case "${command}" in
    *"next dev"*|*"next-server"*)
      ;;
    *)
      return 1
      ;;
  esac

  [[ -n "${cwd}" ]] || return 1

  case "${cwd}" in
    "${ROOT_DIR}"|\
    "${ROOT_DIR}/apps/web"|\
    "${ROOT_DIR}/apps/web/"*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

ensure_frontend_port_available() {
  local pids=()
  local pid

  while IFS= read -r pid; do
    [[ -n "${pid}" ]] && pids+=("${pid}")
  done < <(find_port_listener_pids "${FRONTEND_PORT}")

  ((${#pids[@]} == 0)) && return 0

  for pid in "${pids[@]}"; do
    if pid_is_our_next_dev "${pid}"; then
      echo "Port ${FRONTEND_PORT} is already used by an existing local Next.js dev server (PID ${pid}) — stopping it..."
      kill "${pid}"
      continue
    fi

    if [[ "${FORCE_KILL_FRONTEND_PORT}" == "1" ]]; then
      echo "Port ${FRONTEND_PORT} is occupied by PID ${pid}. FORCE_KILL_FRONTEND_PORT=1 is set, stopping it..."
      kill "${pid}"
      continue
    fi

    echo "Port ${FRONTEND_PORT} is already in use by PID ${pid}." >&2
    echo "Refusing to stop it automatically because it does not look like this project's Next.js dev server." >&2
    echo "If you really want to reclaim the port automatically, rerun with FORCE_KILL_FRONTEND_PORT=1." >&2
    echo "Otherwise inspect it with: lsof -nP -iTCP:${FRONTEND_PORT} -sTCP:LISTEN" >&2
    exit 1
  done

  sleep 1

  if [[ -n "$(find_port_listener_pids "${FRONTEND_PORT}")" ]]; then
    echo "Port ${FRONTEND_PORT} is still busy after cleanup attempt." >&2
    echo "Inspect it with: lsof -nP -iTCP:${FRONTEND_PORT} -sTCP:LISTEN" >&2
    exit 1
  fi
}

print_urls() {
  echo "Frontend:"
  echo "  Local:   http://localhost:${FRONTEND_PORT}"

  echo
  echo "Backend (Next.js API route on the same server):"
  echo "  Local:   http://localhost:${FRONTEND_PORT}${BACKEND_PATH}"
  echo "  Note:    Google sign-in is only configured for localhost/127.0.0.1 in local development."

  echo
  echo "Supabase Studio: http://127.0.0.1:54323"
  echo
  echo "Stop with Ctrl+C  (run 'pnpm db:stop' to also stop the database)"
}

echo "Starting local Supabase stack..."
start_output=$(supabase start --workdir "${ROOT_DIR}" 2>&1) || {
  # Port conflict: Supabase CLI tells us exactly which project to stop
  conflicting=$(echo "${start_output}" | grep -o 'supabase stop --project-id [^ ]*' | awk '{print $NF}')
  if [[ -n "${conflicting}" ]]; then
    echo "Port conflict with project '${conflicting}' — stopping it first..."
    supabase stop --project-id "${conflicting}"
    supabase start --workdir "${ROOT_DIR}"
  else
    echo "${start_output}" >&2
    exit 1
  fi
}

print_urls

ensure_frontend_port_available

exec "${ROOT_DIR}/scripts/with-root-env.sh" \
  pnpm --filter web exec next dev --hostname "${HOST}" --port "${FRONTEND_PORT}"
