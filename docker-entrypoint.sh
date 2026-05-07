#!/bin/sh
set -eu

: "${PORT:=8080}"
: "${GO_GATEWAY_URL:=}"

printf 'window.BLDG_API_BASE = "%s";\n' "$GO_GATEWAY_URL" > /usr/share/nginx/html/config.js
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
