#!/bin/sh
# Бета-версия рядом с продом: appshalamov.github.io/gta-cheats-demo/beta/
# Гипотеза Игоря 14.10.2026: «карта игры в основе, реальная карта — дополнительно» (map.js включает её по адресу /beta/).
# Прод в корне не меняется. Картинки карты бета берёт из общей папки ../img/map (map.js: rebase), поэтому их не копируем.
# Запуск из корня репозитория:  sh tools/make_beta.sh   (потом git add beta && коммит)
set -e
cd "$(dirname "$0")/.."
rm -rf beta
mkdir -p beta
for f in index.html manifest.webmanifest sw.js; do cp "$f" beta/; done
for d in css js icons vendor data; do rsync -a --exclude '._*' "$d/" "beta/$d/"; done
# свой кэш и своё имя у беты, чтобы не путать с продом
n=$(grep -o "const VERSION = '[^']*'" sw.js | sed "s/.*'\(.*\)'.*/\1/")
sed -i '' "s/const VERSION = '[^']*';/const VERSION = 'beta-$n';/" beta/sw.js
sed -i '' 's/"short_name": "Secret Base"/"short_name": "Secret Base β"/; s/"name": "Secret Base — /"name": "Secret Base β — /' beta/manifest.webmanifest
find beta -name '._*' -delete
echo "бета собрана: $(find beta -type f | wc -l | tr -d ' ') файлов, кэш beta-$n"
