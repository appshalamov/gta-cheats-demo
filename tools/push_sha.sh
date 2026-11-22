#!/bin/sh
# Выкладка проверенного коммита ветки (не локального main): sh tools/push_sha.sh <sha>
# Те же предохранители, что у push_main.sh: только перемотка вперёд от прода, зелёная проверка критичного, список уходящего.
set -eu
want="${1:?укажите коммит: sh tools/push_sha.sh <sha>}"
cd "$(dirname "$0")/.."
git fetch -q origin
want=$(git rev-parse "$want")
git merge-base --is-ancestor origin/main "$want" || { echo "СТОП: $want не содержит прод (origin/main) — сначала влить origin/main"; exit 1; }
[ -f "$(git rev-parse --git-common-dir)/critical_ok/$want" ] || { echo "СТОП: нет зелёной проверки критичного для $want — sh tools/critical_check.sh"; exit 1; }
echo "Уходят в прод:"; git log --oneline "origin/main..$want"
git push origin "$want:refs/heads/main"
echo "Готово: https://sbgta.app/ (обновится через ~1 мин)"
