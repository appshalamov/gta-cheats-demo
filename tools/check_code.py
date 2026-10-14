#!/usr/bin/env python3
"""Перед выкладкой: правила кода, которые уже ломали приложение.

1. Положение шторки (#sheet) меняет только js/app.js (openSheet / setSnap / restSheet / closeSheet).
   15.10.2026 ползунок в map.js писал sheet.style.transform = '' — у шторки с тремя положениями это скачок
   на весь экран (Игорь: «веду вправо-влево — карточка открывается во весь экран»).
2. «Поделиться» — только ссылка: navigator.share без files. 15.10.2026 приложение прикладывало картинку к ссылке —
   Telegram отправил фото без ссылки (Игорь: «должна отправляться ссылка с предпросмотром»). Превью ссылки — og:image
   страницы s/<игра>/<id>.html (tools/build_share.py).
3. У страниц «поделиться» превью og:image — своя картинка «игра | жизнь» из s/og (иначе в мессенджере просто кадр).
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
share_bad = []
for f in sorted((ROOT / "js").glob("*.js")):
    if f.name.startswith("._"):
        continue
    for n, line in enumerate(f.read_text("utf-8").splitlines(), 1):
        if "navigator.share" in line and re.search(r"\bfiles\s*:", line):
            share_bad.append(f"{f.name}:{n}: {line.strip()[:100]}")
if share_bad:
    print("СТОП: «Поделиться» прикладывает файл — Telegram потеряет ссылку; делитесь только url (превью — og:image):")
    for b in share_bad:
        print("  ✗", b)
    sys.exit(1)
pages = [p for p in (ROOT / "s").glob("*/*.html") if not p.name.startswith("._")]
no_og = [p.name for p in pages if not re.search(r'property="og:image" content="[^"]*/s/og/', p.read_text("utf-8"))]
if pages and len(no_og) > len(pages) * 0.05:
    print(f"СТОП: {len(no_og)} из {len(pages)} страниц «поделиться» без превью «игра | жизнь» (s/og; пример: {no_og[:3]})"
          " — соберите ~/.video-venv/bin/python tools/build_share.py")
    sys.exit(1)
if bad:
    print("СТОП: положение шторки меняют вне app.js (используйте ctx.restSheet / ctx.setSnap):")
    for b in bad:
        print("  ✗", b)
    sys.exit(1)
print("правила кода: ок")
