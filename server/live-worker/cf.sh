#!/bin/sh
# wrangler для Cloudflare аккаунта app.shalamov (как server/edge-worker/cf-app.sh): свой конфиг, вход loveminesgame не трогает
export PATH="$HOME/.local/node/bin:$PATH" XDG_CONFIG_HOME="$HOME/.config/sbgta-cf-app" WRANGLER_SEND_METRICS=false
cd "$(dirname "$0")" && exec npx -y wrangler@4 "$@"
