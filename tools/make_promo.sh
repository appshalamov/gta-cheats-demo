#!/bin/sh
# Копия прода для съёмки рекламы: appshalamov.github.io/gta-cheats-demo/promo/  (Игорь 05.11.2026:
# «отдельная ссылка, чтобы снять рекламу; быстро билдить и публиковать без тестировщика»).
# Это тот же прод (данные, ползунок, карточки), только своя ссылка и свой кэш — прод в корне не трогаем.
# Главные точки рекламы (своя пара «игра ⇄ жизнь» первой) — список «пара_своя_первой» в
# «Карта локаций GTA — реальный мир/данные/правки_вручную.json»; открыть сразу: /promo/?open=place:<игра>:<id>
# Картинки карты и страницы s/ берутся из корня сайта (../), поэтому их не копируем.
# Запуск из любой папки: sh tools/make_promo.sh   (публикация одной командой — tools/promo.sh)
set -e
cd "$(dirname "$0")/.."
rm -rf promo && mkdir -p promo
for f in index.html manifest.webmanifest sw.js; do cp "$f" promo/; done
for d in css js icons vendor data fonts media; do [ -d "$d" ] && rsync -a --exclude '._*' "$d/" "promo/$d/"; done
# img/ui (картинки интерфейса) нужны оболочке; img/map — общая из корня
[ -d img ] && rsync -a --exclude '._*' --exclude 'map/' img/ promo/img/
# пути: копия в подпапке берёт img/map и s/ из корня — как /beta/ и /design/
sed -i '' 's#/\\/(beta|design)\\//#/\\/(beta|design|promo)\\//#' promo/js/places.js promo/js/league.js
sed -i '' "s#/\\\\/beta\\\\//.test(location.pathname)#/\\\\/(beta|promo)\\\\//.test(location.pathname)#; s#location.pathname.includes('/beta/')#/\\\\/(beta|promo)\\\\//.test(location.pathname)#" promo/js/map.js
# Режим съёмки (Игорь 05.11.2026): всегда английский (и карта, и интерфейс — вне зависимости от языка телефона),
# без подсказки «На экран Домой», без знакомства (онбординга)
sed -i '' "s#setLang(store.lang || (navigator.language || 'ru').slice(0, 2));#store.lang = 'en'; store.onboarded = true; store.installHint = true; save(); setLang('en');#" promo/js/app.js
# карта: по умолчанию реальная (видно, где точка в жизни), своя память выбора — прод на том же устройстве не меняется
sed -i '' "s#localStorage.getItem('secret.map.mode') === 'real' ? 'real' : 'game'; } catch { return 'game'; }#localStorage.getItem('secret.promo.map.mode') === 'game' ? 'game' : 'real'; } catch { return 'real'; }#; s#localStorage.setItem('secret.map.mode', m)#localStorage.setItem('secret.promo.map.mode', m)#" promo/js/map.js
# свои настройки у promo — английский и «знакомство пройдено» не попадают в прод на том же устройстве
sed -i '' "s#^const KEY = 'cheats.v1';#const KEY = 'cheats.promo.v1';#" promo/js/app.js
sed -i '' "s#^const devLang = () => (navigator.language || 'en').slice(0, 2).toLowerCase();#const devLang = () => 'en';#" promo/js/map.js
# «Поделиться»: страницы s/ только в корне — ссылка из promo/ тоже в корень (проверка 05.11.2026 давала 404)
sed -i '' 's#replace(/(beta|design|v3)\\/$/#replace(/(beta|design|v3|promo)\\/$/#' promo/js/map.js
n=$(grep -o "const VERSION = '[^']*'" sw.js | sed "s/.*'\(.*\)'.*/\1/")
sed -i '' "s/const VERSION = '[^']*';/const VERSION = 'promo-$n';/" promo/sw.js
find promo -name '._*' -delete
grep -q "beta|design|promo" promo/js/places.js && grep -q "(beta|promo)" promo/js/map.js && grep -q "v3|promo" promo/js/map.js && grep -q "const devLang = () => 'en'" promo/js/map.js && [ "$(grep -c 'secret.promo.map.mode' promo/js/map.js)" = 2 ] && grep -q "store.installHint = true; save(); setLang('en')" promo/js/app.js || { echo "СТОП: пути копии не поправились (js/places.js, js/map.js)"; exit 1; }
echo "promo собран: $(find promo -type f | wc -l | tr -d ' ') файлов, кэш promo-$n"
find .git -name '._*' -type f -delete 2>/dev/null || true
