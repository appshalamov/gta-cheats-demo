#!/bin/sh
# Быстрая публикация ссылки для рекламы /promo/ — без тестировщика (Игорь 05.11.2026).
# Собирает promo/ из текущего прода и заливает ТОЛЬКО папку promo/ (прод в корне не меняется).
# Запуск: sh tools/promo.sh "что поменяли"
# Через 1–2 минуты: https://appshalamov.github.io/gta-cheats-demo/promo/
set -e
cd "$(dirname "$0")/.."
sh tools/make_promo.sh
git add -A promo
git diff --cached --quiet -- promo && { echo "promo/ без изменений — заливать нечего"; exit 0; }
git commit -q -m "promo/: ${1:-обновление ссылки для рекламы}" -- promo
git push -q origin HEAD:main
echo "залито: https://appshalamov.github.io/gta-cheats-demo/promo/"
