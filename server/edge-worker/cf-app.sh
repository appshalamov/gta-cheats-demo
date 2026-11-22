#!/bin/sh
# wrangler для Cloudflare аккаунта app.shalamov (свой конфиг: не трогает вход loveminesgame ~/.config/sbgta-cf и вход бота)
export PATH="$HOME/.local/node/bin:$PATH" XDG_CONFIG_HOME="$HOME/.config/sbgta-cf-app" WRANGLER_SEND_METRICS=false
cd "$(dirname "$0")" && exec npx -y wrangler@4 "$@"
