#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${GO_GATEWAY_URL:?GO_GATEWAY_URL is required. Set it to the public go-gateway URL, for example https://your-go-gateway.up.railway.app}"
GO_GATEWAY_URL="${GO_GATEWAY_URL%/}"
case "$GO_GATEWAY_URL" in
  http://*|https://*) ;;
  *://*)
    echo "GO_GATEWAY_URL must start with http:// or https://: $GO_GATEWAY_URL" >&2
    exit 1
    ;;
  *)
    GO_GATEWAY_URL="https://$GO_GATEWAY_URL"
    ;;
esac

printf 'window.BLDG_API_BASE = "%s";\n' "$GO_GATEWAY_URL" > /usr/share/nginx/html/config.js
envsubst '${PORT} ${GO_GATEWAY_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
