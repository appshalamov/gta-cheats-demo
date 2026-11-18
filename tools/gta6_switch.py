#!/usr/bin/env python3
"""Один рубильник «GTA 6 вышла» для кодов и карты (18.11.2026). Пишет js/config.js (GTA6) и tools/gta6_release.json.

  python3 tools/gta6_switch.py                       — показать, что сейчас включено
  python3 tools/gta6_switch.py --codes live          — проверенные коды (data/gta6.json из import_gta6_codes.py)
  python3 tools/gta6_switch.py --codes forecast      — назад к прогнозу (python3 tools/build_gta6.py вернёт файл)
  python3 tools/gta6_switch.py --map live --tiles release --maxz 4 --coords own|gtadb
                                                      — карта вышедшей игры с нашего хостинга
  python3 tools/gta6_switch.py --map approx          — назад к своей «Леониде» (запасной путь; в адресе — ?leonida)
  --offline — не проверять плитку по сети (только локальную папку хостинга)

Перед включением проверяет: коды — все status live и у каждого ≥ 2 источника с разных сайтов;
карта — набор yanis (утечки) только с --approve «Игорь ДД.ММ» --check <файл проверки>; плитки зума maxz есть в «хостинг-плиток/gta-map-assets/maps/tiles/6/<набор>/»
и отдаются с appshalamov.github.io/gta-map-assets (иначе в приложении будет пустая карта).
После: build_map.py (если менялась карта), поднять VERSION в sw.js, check_code.py, check_links.py, deep.py, выкладка.
"""
import json
import os
import pathlib
import re
import sys
import urllib.request
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = ROOT / "js" / "config.js"
REL = ROOT / "tools" / "gta6_release.json"
HOST = pathlib.Path(os.environ.get("GTA6_HOST") or ROOT.parent / "хостинг-плиток" / "gta-map-assets" / "maps" / "tiles" / "6")
ASSETS = "https://appshalamov.github.io/gta-map-assets/maps/tiles/6/"
LINE = re.compile(r"^export const GTA6 = \{.*\};$", re.M)


def opt(name):
    a = sys.argv
    return a[a.index(name) + 1] if name in a and a.index(name) + 1 < len(a) else None


def check_codes():
    d = json.loads((ROOT / "data" / "gta6.json").read_text("utf-8"))
    bad = []
    live = [c for c in d["cheats"] if c.get("status") == "live"]
    if not live:
        bad.append("в data/gta6.json нет ни одного проверенного кода (сначала tools/import_gta6_codes.py)")
    for c in live:
        if len({s.get("site") for s in c.get("sources") or []}) < 2:
            bad.append(f"{c['id']}: меньше двух источников с разных сайтов")
        if c["codes"].get("pc"):
            bad.append(f"{c['id']}: код ПК — ПК-версии на старте нет")
    return bad


CHECKS = ROOT.parent / "GTA 6 — реальные данные" / "карта — подтверждения"


def leak_ok(rel, tset):
    """yanis (фанатская карта по утечкам и трейлерам) — только по решению Игоря и с файлом проверки (18.11.2026)."""
    ap = rel.get("approved") or {}
    return ap.get("set") == tset and ap.get("by") and (CHECKS / (ap.get("check") or "-")).is_file()


def check_map(tset, maxz, offline, rel=None):
    bad = []
    if not tset:
        return ["набор плиток не задан"]
    if "yanis" in tset.lower() and not leak_ok(rel or {}, tset):
        return [f"набор «{tset}» — карта по утечкам: нужен --approve «кто и когда» и --check <файл проверки в «карта — подтверждения»>"]
    zdir = HOST / tset / str(maxz)
    tiles = sorted(zdir.glob("*.jpg")) if zdir.is_dir() else []
    if not tiles:
        bad.append(f"нет плиток зума {maxz} в {zdir}")
    elif not offline:
        url = ASSETS + f"{tset}/{maxz}/" + tiles[len(tiles) // 2].name
        try:
            with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=15) as r:
                if r.status != 200:
                    bad.append(f"хостинг отдаёт {r.status}: {url}")
        except Exception as e:  # noqa: BLE001
            bad.append(f"плитка не открывается с хостинга ({e}): {url} — залить gta-map-assets или --offline для локальной проверки")
    return bad


def main():
    rel = json.loads(REL.read_text("utf-8"))
    codes, mp = opt("--codes"), opt("--map")
    if not codes and not mp:
        print(json.dumps(rel, ensure_ascii=False, indent=1))
        return
    bad = []
    if codes:
        if codes not in ("live", "forecast"):
            sys.exit("--codes live|forecast")
        if codes == "live":
            bad += check_codes()
        rel["codes"] = codes
    if mp:
        if mp not in ("live", "approx"):
            sys.exit("--map live|approx")
        if mp == "live":
            rel["tiles"] = opt("--tiles") or rel.get("tiles")
            rel["maxz"] = int(opt("--maxz") or rel.get("maxz") or 4)
            rel["coords"] = opt("--coords") or rel.get("coords")
            if rel["coords"] not in ("own", "gtadb"):
                bad.append("--coords own|gtadb: откуда игровые координаты мест")
            if opt("--approve"):
                rel["approved"] = {"set": rel["tiles"], "by": opt("--approve"), "check": opt("--check")}
            bad += check_map(rel["tiles"], rel["maxz"], "--offline" in sys.argv, rel)
        rel["map"] = mp
    if bad:
        print("СТОП, ничего не меняю:")
        for b in bad:
            print("  ✗", b)
        sys.exit(1)
    rel["updated"] = date.today().isoformat()
    REL.write_text(json.dumps(rel, ensure_ascii=False, indent=1) + "\n", "utf-8")
    s = CFG.read_text("utf-8")
    line = (f"export const GTA6 = {{ codes: '{rel['codes']}', map: '{rel['map']}', tiles: '{rel['tiles']}', "
            f"maxz: {int(rel['maxz'])} }};")
    assert LINE.search(s), "в js/config.js нет строки export const GTA6"
    CFG.write_text(LINE.sub(line, s, count=1), "utf-8")
    print("включено:", line)
    print("дальше: build_map.py (если карта), VERSION в sw.js, check_code.py, check_links.py, deep.py")


if __name__ == "__main__":
    main()
