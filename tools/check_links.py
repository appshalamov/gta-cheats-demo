#!/usr/bin/env python3
"""Перед выкладкой: приложение не уводит пользователя на сторонние сайты (правило Игоря 14.10.2026:
«не уводить на сторонний сервис — максимум Google Maps; карта GTA открывается внутри приложения»).

Ищет в js/*.js и index.html ссылки и переходы наружу: <a href=…>, window.open, location.href = …
Разрешены только: mapsLink(…) / panoLink(…) / o.pano (Google Maps, Apple Maps, Street View),
прямые адреса google.com/maps и maps.apple.com. Всё остальное — стоп (код выхода 1).

Запуск:  python3 tools/check_links.py [файл …]
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
files = [pathlib.Path(f) for f in sys.argv[1:]] or [f for f in sorted((ROOT / "js").glob("*.js")) if not f.name.startswith("._")] + [ROOT / "index.html"]
OK_EXPR = re.compile(r"^\$\{\s*(mapsLink|panoLink)\(|^\$\{\s*o\.pano\s*\}$")
OK_URL = re.compile(r"^https://(www\.)?google\.com/maps|^https://maps\.apple\.com|^#|^mailto:|^\./|^/|^[a-z0-9_./-]+\.html?$", re.I)
bad = []
for f in files:
    if not f.exists():
        continue
    for n, line in enumerate(f.read_text("utf-8").splitlines(), 1):
        for m in re.finditer(r"<a\b[^>]*?\bhref=\"([^\"]*)\"", line):
            href = m.group(1)
            if OK_EXPR.search(href) or OK_URL.search(href):
                continue
            bad.append(f"{f.name}:{n}: <a href=\"{href[:80]}\">")
        for m in re.finditer(r"window\.open\(|location\.href\s*=\s*['\"`]https?://", line):
            bad.append(f"{f.name}:{n}: {line.strip()[:90]}")
if bad:
    print("СТОП: ссылки наружу (разрешено только Google/Apple Maps и Street View):")
    for b in bad:
        print("  ✗", b)
    sys.exit(1)
print(f"ссылки наружу: ок ({len(files)} файлов)")
