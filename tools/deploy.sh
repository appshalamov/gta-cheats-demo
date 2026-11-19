#!/bin/sh
# Публикация на GitHub Pages: https://sbgta.app/
set -e
cd "$(dirname "$0")/.."
find . -name '._*' -delete
git add -A
git commit -m "${1:-update}" || true
git push origin main
echo "Готово: https://sbgta.app/ (обновится через ~1 мин)"
