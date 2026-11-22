#!/bin/bash
# Проверка жизненно важного перед выкладкой (Игорь 22.11.2026: «выбрал GTA 5 — в картах Майами, грубая ошибка»).
# Коды по играм и платформам, карта выбранной игры, карточка места, пейвол, офлайн. Зелёный итог → метка для этого коммита,
# без неё tools/push_main.sh и tools/push_sha.sh не выкладывают. Запуск из любого worktree: sh tools/critical_check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"; SHA=$(git rev-parse HEAD)
[ -n "$(git status --porcelain --untracked-files=no)" ] && { echo "СТОП: есть незакоммиченные правки — проверяется только коммит"; exit 1; }
T="$REPO/../Тестирование 21.10"; OUT="$T/снимки/critical-$(git rev-parse --short HEAD)"; mkdir -p "$OUT"
TESTS="critical_core,ref_link,cheat_platforms,onb_full,home_game_switch,map_pro,map_switch_chooser,place_card,paywall_conversion,try_free,offline"
cd "$T"
heavy-run -p 2 -n "критичное $(git -C "$REPO" rev-parse --short HEAD)" -- ~/.video-venv/bin/python run_local.py "$REPO" "" "$OUT" "$TESTS" > "$OUT/log.txt" 2>&1 || true
grep "^✅\|^❌\|ИТОГ" "$OUT/log.txt" | cut -c1-160
if grep -q "^❌" "$OUT/log.txt" || ! grep -q "ИТОГ" "$OUT/log.txt"; then echo "КРИТИЧНОЕ НЕ ПРОШЛО — выкладывать нельзя ($OUT/log.txt)"; exit 1; fi
M="$(git -C "$REPO" rev-parse --git-common-dir)/critical_ok"; mkdir -p "$M"; date '+%F %T' > "$M/$SHA"
echo "Критичное зелёное: метка для $SHA"
