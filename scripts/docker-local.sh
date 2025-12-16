#!/usr/bin/env bash
set -euo pipefail

rewrite_proxy_host() {
  local value="${1:-}"
  value="${value//127.0.0.1/host.docker.internal}"
  value="${value//localhost/host.docker.internal}"
  printf '%s' "$value"
}

maybe_rewrite_proxy_var() {
  local name="$1"
  local current="${!name-}"
  if [[ -n "${current}" ]]; then
    export "$name"="$(rewrite_proxy_host "$current")"
  fi
}

append_no_proxy_host() {
  local name="$1"
  local current="${!name-}"
  if [[ -z "${current}" ]]; then
    export "$name"="host.docker.internal"
    return
  fi
  if [[ ",${current}," != *",host.docker.internal,"* ]]; then
    export "$name"="${current},host.docker.internal"
  fi
}

# If the user sets proxies to a localhost listener (common for Clash/V2Ray/etc),
# Docker build containers cannot reach 127.0.0.1, so rewrite to host.docker.internal.
maybe_rewrite_proxy_var http_proxy
maybe_rewrite_proxy_var https_proxy
maybe_rewrite_proxy_var HTTP_PROXY
maybe_rewrite_proxy_var HTTPS_PROXY

has_http_proxy=0
if [[ -n "${http_proxy-}${https_proxy-}${HTTP_PROXY-}${HTTPS_PROXY-}" ]]; then
  has_http_proxy=1
fi

# Prefer HTTP(S)_PROXY when present; avoid SOCKS ALL_PROXY overriding HTTP clients.
if [[ "$has_http_proxy" -eq 1 ]]; then
  unset all_proxy ALL_PROXY || true
else
  maybe_rewrite_proxy_var all_proxy
  maybe_rewrite_proxy_var ALL_PROXY
fi

if [[ -n "${http_proxy-}${https_proxy-}${all_proxy-}${HTTP_PROXY-}${HTTPS_PROXY-}${ALL_PROXY-}" ]]; then
  append_no_proxy_host no_proxy
  append_no_proxy_host NO_PROXY
fi

exec docker compose -f docker-compose.local.yml up --build "$@"
