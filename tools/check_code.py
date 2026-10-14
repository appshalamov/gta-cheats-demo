#!/usr/bin/env python3
"""Перед выкладкой: правила кода, которые уже ломали приложение.

1. Положение шторки (#sheet) меняет только js/app.js (openSheet / setSnap / restSheet / closeSheet).
   15.10.2026 ползунок в map.js писал sheet.style.transform = '' — у шторки с тремя положениями это скачок
   на весь экран (Игорь: «веду вправо-влево — карточка открывается во весь экран»).
Запуск: python3 tools/check_code.py   (код выхода 1 — нарушение)
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
bad = []
for f in sorted((ROOT / "js").glob("*.js")):
    if f.name.startswith("._") or f.name == "app.js":
        continue
    for n, line in enumerate(f.read_text("utf-8").splitlines(), 1):
        if re.search(r"getElementById\(['\"]sheet['\"]\)|querySelector\(['\"]#sheet['\"]\)", line) and "transform" in line:
            bad.append(f"{f.name}:{n}: {line.strip()[:100]}")
if bad:
    print("СТОП: положение шторки меняют вне app.js (используйте ctx.restSheet / ctx.setSnap):")
    for b in bad:
        print("  ✗", b)
    sys.exit(1)
print("правила кода: ок")
