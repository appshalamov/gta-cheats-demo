#!/bin/sh
# Третья ссылка — редизайн «Стекло над городом»: appshalamov.github.io/gta-cheats-demo/design/
# Игорь 16.10.2026: «выкладывай в бету третья версия». Прод в корне и /beta/ не меняются.
# Код — из ветки design/glass-city (этот worktree), данные — из выкладываемого корня (то, что уже на сайте),
# картинки карты — общие ../img/map (как у /beta/), поэтому не копируются.
# Запуск:  sh tools/make_design.sh "<корень репозитория, куда собрать>"   (потом git add design && коммит)
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="${1:?укажите корень репозитория, куда собрать design/}"
cd "$DST"
rm -rf design
mkdir -p design
for f in index.html manifest.webmanifest sw.js; do cp "$SRC/$f" design/; done
for d in css js icons vendor fonts img/ui; do mkdir -p "design/$d"; rsync -a --exclude '._*' "$SRC/$d/" "design/$d/"; done
# данные — те, что уже выложены в корне (не незаконченная работа других веток)
rsync -a --exclude '._*' "$DST/data/" design/data/
# свой кэш и имя, чтобы не путать с продом и бетой
n=$(grep -o "const VERSION = '[^']*'" "$SRC/sw.js" | sed "s/.*'\(.*\)'.*/\1/")
sed -i '' "s/const VERSION = '[^']*';/const VERSION = 'design-$n';/" design/sw.js
sed -i '' 's/"short_name": "Secret Base"/"short_name": "Secret Base 3"/; s/"name": "Secret Base — /"name": "Secret Base 3 — /' design/manifest.webmanifest
# картинки карты и превью ссылок лежат в корне сайта: /design/ ходит за ними на уровень выше, как /beta/
sed -i '' "s#const IMG_BASE = /\\\\/beta\\\\//.test(location.pathname) ? '../' : '';#const IMG_BASE = /\\\\/(beta|design)\\\\//.test(location.pathname) ? '../' : '';#" design/js/map.js
sed -i '' "s#location.pathname.includes('/beta/') ? '../' : ''#/\\\\/(beta|design)\\\\//.test(location.pathname) ? '../' : ''#" design/js/map.js
grep -q "(beta|design)" design/js/map.js || { echo "СТОП: не удалось направить картинки карты в ../img/map"; exit 1; }
# миниатюры мест на Главной, в Поиске и Избранном (places.js thumbOf) тоже из корня сайта
python3 - design/js/places.js <<'PY'
import sys
p = sys.argv[1]; s = open(p, encoding="utf-8").read()
old = "return ph ? (ph.thumb || ph.file) : '';"
new = "const u = ph ? (ph.thumb || ph.file) : ''; return typeof u === 'string' && u.startsWith('img/map/') && /\\/(beta|design)\\//.test(location.pathname) ? '../' + u : u;"
assert old in s, "СТОП: thumbOf в places.js изменился — поправьте make_design.sh"
open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))
PY
find design -name '._*' -delete
echo "design собран: $(find design -type f | wc -l | tr -d ' ') файлов, кэш design-$n"
find .git -name '._*' -type f -delete 2>/dev/null || true
