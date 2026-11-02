#!/bin/sh
# MVP = ветка mvp/simple отдельной ссылкой: appshalamov.github.io/gta-cheats-demo/mvp/ (Игорь 02.11.2026: «упростить до MVP…
# опубликовать отдельной ссылкой, чтобы прокликать»). Прод (корень), /beta/ и /v3/ не меняются.
# Картинки карты и превью ссылок (s/) MVP берёт из общих папок корня (map.js и places.js: IMG_BASE = '../' в подпапке).
# Запуск:  sh tools/make_mvp.sh "<папка-цель>"   — цель: корень репозитория, собранного от origin/main (туда ляжет mvp/)
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="$1/mvp"
[ -n "$1" ] && [ -d "$1/.git" -o -f "$1/.git" ] || { echo "укажите корень git-репозитория для выкладки"; exit 1; }
rm -rf "$DST"; mkdir -p "$DST"
for f in index.html manifest.webmanifest sw.js; do cp "$SRC/$f" "$DST/"; done
for d in css js icons fonts vendor data; do rsync -a --exclude '._*' "$SRC/$d/" "$DST/$d/"; done
mkdir -p "$DST/img"; rsync -a --exclude '._*' "$SRC/img/ui/" "$DST/img/ui/"
# свой кэш у MVP: семейство mvp-vNN и mvp-ui-vNN (family() в sw.js чистит только своё семейство — прод, бету и v3 не трогает)
n=$(grep -o "const VERSION = '[^']*'" "$SRC/sw.js" | sed "s/.*'\(.*\)'.*/\1/")
sed -i '' "s/const VERSION = '[^']*';/const VERSION = 'mvp-$n';/" "$DST/sw.js"
grep -q "const VERSION = 'mvp-" "$DST/sw.js" || { echo "СТОП: не удалось задать кэш mvp- в mvp/sw.js"; exit 1; }
sed -i '' 's/"short_name": "Secret Base"/"short_name": "Secret Base MVP"/' "$DST/manifest.webmanifest"
find "$DST" -name '._*' -delete
echo "mvp собрана: $(find "$DST" -type f | wc -l | tr -d ' ') файлов, кэш mvp-$n"
