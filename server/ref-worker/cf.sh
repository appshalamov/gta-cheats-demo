#!/bin/sh
# wrangler для сервера рефералки Secret Base — тот же вход в Cloudflare, что у оплаты (аккаунт loveminesgame, свой конфиг).
#   sh cf.sh deploy ; sh cf.sh secret put IP_SALT ; sh cf.sh d1 execute sb-ref --remote --file schema.sql
export PATH="$HOME/.local/node/bin:$PATH"
export XDG_CONFIG_HOME="$HOME/.config/sbgta-cf"
export WRANGLER_SEND_METRICS=false
mkdir -p "$XDG_CONFIG_HOME"
cd "$(dirname "$0")" && exec npx -y wrangler@4 "$@"
