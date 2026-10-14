#!/usr/bin/env python3
"""Перед выкладкой карты: новая сборка data/map/*.json не должна молча терять то, что уже было в проде.

Сравнивает с версией в git (по умолчанию HEAD = текущий прод): пропавшие места, пропавшие пары «игра ⇄ жизнь»,
пропавшие фото (игра / жизнь), места, уехавшие дальше 2 км. Код выхода 1, если потери есть и не разрешены.
Разрешить осознанную потерю — перечислить id в tools/regress_ok.txt (по строке, с причиной после #).

Запуск:  python3 tools/check_regress.py [git-ref]
Почему (14.10.2026): агенты проверки данных дважды за день незаметно портили выдачу — испорченная широта
(места улетели за тысячи км) и стёртые привязки gtadb (у Del Perro Pier и др. пропало сравнение ползунком).
"""
import json
import math
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REF = sys.argv[1] if len(sys.argv) > 1 else "HEAD"
OK_F = ROOT / "tools" / "regress_ok.txt"
ok = {l.split("#")[0].strip() for l in OK_F.read_text("utf-8").splitlines()} if OK_F.exists() else set()


def km(a, b):
    R = 6371.0
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    x = math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


def items(d):
    out = {p["id"]: p for p in d["places"]}
    out.update({e["id"]: e for e in d["eggs"]})
    for p in d["places"]:
        for e in p.get("eggs", []):
            out[e["id"]] = {**e, "_in": p["id"]}
    return out


bad_total = 0
for g in ("gta6", "gta5"):
    old_raw = subprocess.run(["git", "-C", str(ROOT), "show", f"{REF}:data/map/{g}.json"], capture_output=True)
    if old_raw.returncode:
        print(f"{g}: в {REF} нет data/map/{g}.json — сравнивать не с чем"); continue
    old, new = items(json.loads(old_raw.stdout)), items(json.loads((ROOT / "data" / "map" / f"{g}.json").read_text("utf-8")))
    alias = {a for p in new.values() for a in (p.get("alias") or [])}
    problems = []
    for k, o in old.items():
        if k in ok:
            continue
        n = new.get(k)
        if n is None:
            problems.append(f"пропало место/пасхалка {k} ({o.get('g') or (o.get('t') or {}).get('ru', '')})"); continue
        if o.get("pairs") and not n.get("pairs"):
            problems.append(f"{k}: пропали пары «игра ⇄ жизнь» (было {len(o['pairs'])})")
        if (o.get("pg") or o.get("gg")) and not (n.get("pg") or n.get("gg") or n.get("pairs")):
            problems.append(f"{k}: пропал кадр игры")
        if (o.get("pr") or o.get("gl")) and not (n.get("pr") or n.get("gl") or n.get("pairs")):
            problems.append(f"{k}: пропало фото из жизни")
        d = km((o["lat"], o["lon"]), (n["lat"], n["lon"]))
        if d > 2:
            problems.append(f"{k}: точка уехала на {d:.1f} км")
    print(f"{g}: было {len(old)}, стало {len(new)}, потерь {len(problems)}")
    for line in problems[:40]:
        print("   ✗", line)
    bad_total += len(problems)
if bad_total:
    print(f"\nСТОП: {bad_total} потерь. Исправьте или впишите id в tools/regress_ok.txt с причиной.")
sys.exit(1 if bad_total else 0)
