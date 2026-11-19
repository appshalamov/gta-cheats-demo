#!/bin/sh
# wrangler для сервера оплаты Secret Base — со своим входом в Cloudflare (аккаунт loveminesgame, где DNS sbgta.app).
# Вход бота Игоря (другой аккаунт, ~/Library/Preferences/.wrangler) не трогается: здесь отдельная папка настроек.
#   sh cf.sh login            — вход (откроется браузер, кнопка Allow)
#   sh cf.sh <команда wrangler> — например: sh cf.sh deploy ; sh cf.sh secret put STRIPE_SECRET_KEY
export PATH="$HOME/.local/node/bin:$PATH"
export XDG_CONFIG_HOME="$HOME/.config/sbgta-cf"
export WRANGLER_SEND_METRICS=false
mkdir -p "$XDG_CONFIG_HOME"
cd "$(dirname "$0")" && exec npx -y wrangler@4 "$@"
