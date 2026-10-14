#!/bin/sh
# Публикация на GitHub Pages: https://appshalamov.github.io/gta-cheats-demo/
set -e
cd "$(dirname "$0")/.."
find . -name '._*' -delete
git add -A
git commit -m "${1:-update}" || true
git push origin main
echo "Готово: https://appshalamov.github.io/gta-cheats-demo/ (обновится через ~1 мин)"
