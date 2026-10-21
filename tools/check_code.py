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
# 4. У каждой кнопки «Поделиться» есть ключ места — иначе уходит ссылка на само приложение (15.10.2026: точки gtadb
#    на пирсе Санта-Моники делились без ссылки на место). Вызовы actions(...) в разметке — с ключом `<вид>:${game}:…`.
for f in sorted((ROOT / "js").glob("*.js")):
    if f.name.startswith("._"):
        continue
    for n, line in enumerate(f.read_text("utf-8").splitlines(), 1):
        if "${actions(" in line and not re.search(r"`(place|egg|db):\$\{game\}:", line):
            share_bad.append(f"{f.name}:{n}: кнопка «Поделиться» без ключа места: {line.strip()[:90]}")
        if 'data-mp="share"' in line and "data-k=" not in line:
            share_bad.append(f"{f.name}:{n}: data-mp=share без data-k: {line.strip()[:90]}")
if share_bad:
    print("СТОП: «Поделиться» сломается (только url с ключом места; файл не прикладывать — Telegram теряет ссылку):")
    for b in share_bad:
        print("  ✗", b)
    sys.exit(1)
pages = [p for p in (ROOT / "s").glob("*/*.html") if not p.name.startswith(("._", "db-"))]
# 6. Ползунок на страницах «поделиться» — на событиях касания с passive:false (15.10.2026: на iPhone не тянулся — pointercancel)
_pg = next((p for p in (ROOT / "s" / "gta5").glob("*.html") if not p.name.startswith("._") and 'class="cmp' in p.read_text("utf-8")), None)
if _pg is not None:
    _t = _pg.read_text("utf-8")
    if "addEventListener('touchmove'" not in _t or "passive:false" not in _t.replace(" ", "") or "addEventListener('pointercancel'" in _t:
        print(f"СТОП: ползунок страницы «поделиться» ({_pg.name}) не на событиях касания — на iPhone не будет тянуться")
        sys.exit(1)
# 5. Вёрстка страниц «поделиться»: ползунок — на всю ширину, не в сетке .pics (15.10.2026: сломались 1606 страниц)
lay_bad = [p.name for p in (ROOT / "s").glob("*/*.html") if not p.name.startswith("._") and 'class="pics"><div class="cmp' in p.read_text("utf-8")]
if lay_bad:
    print(f"СТОП: на {len(lay_bad)} страницах «поделиться» ползунок внутри сетки .pics (пример: {lay_bad[:3]}) — ~/.video-venv/bin/python tools/build_share.py")
    sys.exit(1)   # db- — точки gtadb, превью = кадр игры
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
# 7. Service worker: при обновлении удаляет только старые версии своего семейства (v73 → v74). Прод, /beta/, /design/
#    и /v3/ — один домен и одно хранилище кэшей; до 21.10.2026 каждая версия стирала кэши остальных (тест 21.10).
for _sw in [ROOT / "sw.js", *sorted(ROOT.glob("*/sw.js"))]:
    if _sw.exists() and not _sw.parent.name.startswith("._"):
        _s = _sw.read_text("utf-8")
        if "caches.delete" in _s and "family(k) === family(VERSION)" not in _s and "k.startsWith('v3-')" not in _s:
            print(f"СТОП: {_sw.relative_to(ROOT)} при обновлении стирает чужие кэши — удаляйте только family(k) === family(VERSION)")
            sys.exit(1)
# 8. Миниатюры мест (places.js thumbOf) в копиях сайта в подпапках берут img/map из корня — как rebase в map.js
#    (21.10.2026: в бете миниатюры Главной давали 404).
_pl = (ROOT / "js" / "places.js").read_text("utf-8")
if "export function thumbOf" in _pl and not re.search(r"IMG_BASE|imgUrl\(", _pl.split("export function thumbOf", 1)[1].split("\n}", 1)[0]):
    print("СТОП: thumbOf в js/places.js не добавляет ../ для /beta/ и /design/ — миниатюры там будут 404")
    sys.exit(1)
print("правила кода: ок")
