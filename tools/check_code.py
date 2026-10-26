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
import json
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
# 7. Пейвол и онбординг без слов о деньгах авторов, онбординг без «$»; в имени и <title> нет марок (Ресерч 31 §4.3 п. 4,
#    32 §5.2, 28 §6.0 money_guard). Заработок не продаётся (FTC 16 CFR 437): на пейволе его нет ни в коде, ни в строках pw_*.
MONEY = re.compile(r"зараб|выплат|доход|\bearn|payout|income", re.I)
MARKS = re.compile(r"GTA|Grand Theft|Rockstar|Vice City|Leonida|Los Santos|гта", re.I)
_app = (ROOT / "js" / "app.js").read_text("utf-8")
_i18n = (ROOT / "js" / "i18n.js").read_text("utf-8")
def _block(text, start, end):
    i = text.find(start); j = text.find(end, i + 1)
    return text[i:j] if i >= 0 and j > i else None
guard = []
_pw = _block(_app, "// ───────── пейвол", "// ───────── онбординг")
_ob = _block(_app, "// ───────── онбординг", "// ───────── установка на экран")
if _pw is None or _ob is None:
    guard.append("app.js: не нашёл блоки «пейвол» / «онбординг» — проверка денег не может пройти")
def _vals(pref):
    return [(m.group(1), m.group(3)) for m in re.finditer(r"\b(" + pref + r"\w*)\s*:\s*(['\"])((?:\\.|(?!\2).)*)\2", _i18n)]
for name, txt in [("пейвол (app.js)", _pw or "")] + [(f"i18n {k}", v) for k, v in _vals("pw_")]:
    m = MONEY.search(txt)
    if m: guard.append(f"{name}: «{m.group(0)}» — на пейволе ни слова о заработке")
for name, txt in [("онбординг (app.js)", _ob or "")] + [(f"i18n {k}", v) for k, v in _vals("w_") + _vals("ob_")]:
    m = MONEY.search(txt) or (name.startswith("i18n") and re.search(r"\$", txt))   # «$» — только в строках (в коде это $() и ${})
    if m: guard.append(f"{name}: «{m.group(0)}» — в онбординге нет денег и сумм")
_man = json.loads((ROOT / "manifest.webmanifest").read_text("utf-8"))
_title = re.search(r"<title>(.*?)</title>", (ROOT / "index.html").read_text("utf-8"), re.S)
for name, txt in [("manifest name", _man.get("name", "")), ("manifest short_name", _man.get("short_name", "")), ("<title>", _title.group(1) if _title else "")]:
    m = MARKS.search(txt)
    if m: guard.append(f"{name}: «{m.group(0)}» — марки в имени нельзя (ASRG 4.1(c), 32 §3.1)")
if guard:
    print("СТОП: деньги на пейволе/онбординге или марка в имени:")
    for b in guard:
        print("  ✗", b)
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
# 9. Адреса и названия мест в данных карты — без русского текста: показываются и в английском интерфейсе
#    (21.10.2026: «Угол Wythe Ave и N 11th St», «— прообраз Hill Valley Church» на Главной в EN).
import json as _json
for _g in ("gta5", "gta6"):
    _f = ROOT / "data" / "map" / f"{_g}.json"
    if _f.exists():
        _d = _json.loads(_f.read_text("utf-8"))
        _ru = [x.get("id") for x in _d.get("places", []) if re.search("[А-Яа-яЁё]", str(x.get("n", "")) + str(x.get("a", "")))]
        _ru += [x.get("id") for x in _d.get("eggs", []) if re.search("[А-Яа-яЁё]", str(x.get("p", "")))]
        if _ru:
            print(f"СТОП: data/map/{_g}.json — русский текст в адресе или названии места (видно в EN): {_ru[:5]}")
            sys.exit(1)
# 10. Режим demo (08 ТЗ §1, FTC: реклама с суммами): на каждом экране и в каждой шторке креаторского раздела внизу строка
#     «Пример интерфейса. Цифры показаны для примера». Флагом её не убрать: modeNote() в demo отдаёт её без условий,
#     её вставляют body() (все экраны) и sheet() (все шторки), а ctx.openSheet в league.js вызывается только внутри sheet().
DEMO_NOTE = "Пример интерфейса. Цифры показаны для примера"
_lg = (ROOT / "js" / "league.js").read_text("utf-8")
demo_bad = []
if f"demo_note: '{DEMO_NOTE}'" not in _lg:
    demo_bad.append(f"league.js: нет строки demo_note: '{DEMO_NOTE}'")
_mn = re.search(r"const modeNote = \([^)]*\) => \(mode\(\) === 'demo' \? `[^`]*tx\('demo_note'\)[^`]*`", _lg)
if not _mn:
    demo_bad.append("league.js: modeNote() в demo должна первой веткой, без условий, отдавать tx('demo_note')")
_bd = re.search(r"^const body = .*$", _lg, re.M)
if not _bd or "modeNote(" not in _bd.group(0):
    demo_bad.append("league.js: body() не вставляет modeNote() — экраны в demo останутся без «Пример интерфейса»")
_sh = re.search(r"^const sheet = .*$", _lg, re.M)
if not _sh or "modeNote(" not in _sh.group(0) or "ctx.openSheet(" not in _sh.group(0):
    demo_bad.append("league.js: sheet() не вставляет modeNote() в шторку")
_os = [n for n, line in enumerate(_lg.splitlines(), 1) if "ctx.openSheet(" in line and not line.startswith("const sheet = ")]
if _os:
    demo_bad.append(f"league.js: шторка мимо sheet() (без пометки режима), строки {_os[:5]}")
# экраны раздела без body(): каждый SCREENS[...].html даёт body( или явный modeNote(
_scr = re.search(r"^const SCREENS = \{(.*?)^\};", _lg, re.S | re.M)
if _scr:
    for m in re.finditer(r"^  (\w+): \{ html: (.*)$", _scr.group(1), re.M):
        name, line = m.group(1), m.group(2)
        fn = re.match(r"(?:async \([^)]*\) => )?(\w+)\b", line)
        src = line
        if fn and fn.group(1) not in ("async",):
            dm = re.search(r"^(?:async )?function " + re.escape(fn.group(1)) + r"\b.*?^\}", _lg, re.S | re.M)
            if dm: src += dm.group(0)
        if "body(" not in src and "modeNote(" not in src:
            # лента роликов: пометка — в плашке «Заработок с ролика»
            if name == "feed" and "${modeNote(" in _lg.split("async function feedHTML", 1)[1].split("\nfunction ", 1)[0]:
                continue
            demo_bad.append(f"league.js: экран {name} без body()/modeNote() — в demo нет «Пример интерфейса»")
else:
    demo_bad.append("league.js: не нашёл SCREENS")
_hub = re.search(r"^async function hubHTML\(\).*?^\}", _lg, re.S | re.M)
if not _hub or "modeNote(" not in _hub.group(0):
    demo_bad.append("league.js: хаб «Для авторов» без modeNote() в demo")
if demo_bad:
    print("СТОП: режим demo без строки «Пример интерфейса» (08 ТЗ §1, FTC):")
    for b in demo_bad:
        print("  ✗", b)
    sys.exit(1)
# 11. ?sbmock — не в боевой сборке (06 В-1, 08 §1): только на localhost / 127.0.0.1 или при включённом demo админа.
_api = (ROOT / "js" / "api.js").read_text("utf-8")
_mp = re.search(r"^function mockPick\(\) \{\n(.*?)^\}", _api, re.S | re.M)
if not _mp or not re.match(r"\s*if \(!devGate\(\)\) \{[^\n]*return null; \}", _mp.group(1)) or not re.search(r"const devGate = \(\) => DEV \|\| DEMO_ON;", _api) \
        or r"const DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);" not in _api:
    print("СТОП: js/api.js — ?sbmock должен первой строкой mockPick() отключаться вне localhost и без demo (devGate)")
    sys.exit(1)
_sbm = [f"{f.name}:{n}" for f in sorted((ROOT / "js").glob("*.js")) if not f.name.startswith("._") and f.name != "api.js"
        for n, line in enumerate(f.read_text("utf-8").splitlines(), 1) if "sbmock" in line and not line.lstrip().startswith("//")]
if _sbm:
    print(f"СТОП: ?sbmock читают вне js/api.js (мимо devGate): {_sbm[:5]}")
    sys.exit(1)
print("правила кода: ок")
