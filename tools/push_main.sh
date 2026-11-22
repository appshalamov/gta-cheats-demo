#!/bin/sh
# Безопасная выкладка в прод: sh tools/push_main.sh <ожидаемый коммит вершины main>
# Отправляет main, только если его вершина — ровно тот коммит, который проверили тестами. Показывает все уходящие коммиты.
# Зачем (19.11.2026): слияние с ошибкой, «спрятанное» за `| tail`, не остановило push — ушёл чужой коммит. Здесь любой сбой = стоп.
set -eu
want="${1:?укажите ожидаемый коммит: sh tools/push_main.sh <sha>}"
cd "$(dirname "$0")/.."
git fetch -q origin
head=$(git rev-parse main); want=$(git rev-parse "$want")
if [ "$head" != "$want" ]; then echo "СТОП: вершина main $head, а проверяли $want"; git log --oneline "$want..main" || true; exit 1; fi
if ! git merge-base --is-ancestor origin/main main; then echo "СТОП: origin/main ушёл вперёд — сначала влить"; exit 1; fi
# жизненно важное (22.11.2026): без зелёной tools/critical_check.sh для этого коммита — не выкладываем
[ -f "$(git rev-parse --git-common-dir)/critical_ok/$want" ] || { echo "СТОП: нет зелёной проверки критичного для $want — sh tools/critical_check.sh"; exit 1; }
echo "Уходят в прод:"; git log --oneline origin/main..main
git push origin main
echo "Готово: https://sbgta.app/ (обновится через ~1 мин)"
