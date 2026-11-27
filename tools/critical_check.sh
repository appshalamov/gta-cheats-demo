#!/bin/bash
# Проверка жизненно важного перед выкладкой (Игорь 22.11.2026: «выбрал GTA 5 — в картах Майами, грубая ошибка»).
# Коды по играм и платформам, карта выбранной игры, карточка места, пейвол, офлайн. Зелёный итог → метка для этого коммита,
# без неё tools/push_main.sh и tools/push_sha.sh не выкладывают. Запуск из любого worktree: sh tools/critical_check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$PWD"; SHA=$(git rev-parse HEAD)
[ -n "$(git status --porcelain --untracked-files=no)" ] && { echo "СТОП: есть незакоммиченные правки — проверяется только коммит"; exit 1; }
T="$REPO/../Тестирование 21.10"; OUT="$T/снимки/critical-$(git rev-parse --short HEAD)"; mkdir -p "$OUT"
TESTS="critical_core,ref_link,cheat_platforms,onb_full,home_game_switch,map_pro,map_switch_chooser,place_card,paywall_conversion,try_free,offline,guide_hub,guide_spoilers,search_kw,guide_open_top,guide_double_tap,guide_details"
touch "$OUT/.start"   # 28.11: проверка идёт по рабочей папке — правки во время прогона делают метку ложной
cd "$T"
heavy-run -p 2 -n "критичное $(git -C "$REPO" rev-parse --short HEAD)" -- ~/.video-venv/bin/python run_local.py "$REPO" "" "$OUT" "$TESTS" > "$OUT/log.txt" 2>&1 || true
grep "^✅\|^❌\|ИТОГ" "$OUT/log.txt" | cut -c1-160
if grep -q "^❌" "$OUT/log.txt" || ! grep -q "ИТОГ" "$OUT/log.txt"; then echo "КРИТИЧНОЕ НЕ ПРОШЛО — выкладывать нельзя ($OUT/log.txt)"; exit 1; fi
# файлы из .gitignore — служебные (кэш wrangler теста ref_link, ._ exFAT): не правки; 28.11 новый worktree не получал метку из-за них
CH=$(cd "$REPO" && find . -path ./.git -prune -o -type f -newer "$OUT/.start" -print | { grep -v '^./.git' || true; } | { git check-ignore -v -n --stdin --no-index 2>/dev/null | awk -F'\t' '$1 == "::" {print $2}' || true; } | head -5)
if [ "$(git -C "$REPO" rev-parse HEAD)" != "$SHA" ] || [ -n "$(git -C "$REPO" status --porcelain --untracked-files=no)" ] || [ -n "$CH" ]; then
  echo "СТОП: во время прогона менялись файлы или коммит ($CH) — метки нет, запустите заново"; exit 1; fi
M="$(git -C "$REPO" rev-parse --git-common-dir)/critical_ok"; mkdir -p "$M"; date '+%F %T' > "$M/$SHA"
echo "Критичное зелёное: метка для $SHA"
