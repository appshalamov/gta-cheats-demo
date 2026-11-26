#!/usr/bin/env python3
"""Записи указателя гида от функции «Не упустить навсегда» (guide-saves, 27.11.2026): data/guide/saves.json → data/guide/entries-saves-gta6.json.
Формат и стопы — шапка tools/build_guide_index.py. Проверка всего указателя после: python3 tools/build_guide_index.py --check

Записи:
  saves:gta6:all            kind save — справочник (kw для поиска);
  saves:gta6:playstation|xbox|before-code — kind save, «По шагам», бесплатно (free), steps_n/min;
  saves:gta6:<точка>        kind warn, lvl 1, until m:<миссия>, from — глава миссии: по ним stateLine ядра сама даёт янтарную строку
                            на Главной за 2 миссии. t — дело без названия миссии (строка видна и без отметки), sub — вид потери.
Запуск: python3 tools/saves_entries.py [--check]
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
G = ROOT / "data" / "guide"
d = json.loads((G / "saves.json").read_text("utf-8"))
game = d["game"]

# короткое дело для строки состояния «Через 2 миссии точка невозврата: …» — без названий миссий (спойлер)
ACT = {
    "tourist-trap": {"ru": "закончите дела в Key Lento и сохранитесь в новый слот", "en": "finish Key Lento side activities and save to a new slot"},
    "checking-out": {"ru": "заберите вещи из мотеля и сохранитесь", "en": "take your things from the motel and save"},
    "finale": {"ru": "сохранитесь в отдельный слот до выбора концовки", "en": "make a separate save before the ending choice"},
}
items = []
src_all = sorted({u for r in d["pnr"] for u in r["src"]} | {u for x in ("playstation", "xbox") for u in d["save"][x]["src"]})
items.append({
    "k": f"saves:{game}:all", "kind": "save", "free": True, "st": "ok", "src_n": len(src_all),
    "t": {"ru": "Не упустить навсегда", "en": "Don't miss it forever"},
    "sub": {"ru": "Все точки невозврата и как сохраняться", "en": "Every point of no return and how to save"},
    "kw": d["kw"], "next": ["walk:" + game, f"saves:{game}:playstation", "endings:" + game],
})
for key, h in d["save"].items():
    ix = h["ix"]
    items.append({
        "k": ix["k"], "kind": "save", "free": True, "st": ix["st"], "src_n": len(h["src"]),
        **({"plat": ix["plat"]} if ix.get("plat") else {}),
        "t": h["ta"], "sub": h["rw"], "steps_n": len(h["st"]), "min": h["min"], "next": ix["next"],
    })
for r in d["pnr"]:
    items.append({
        "k": r["k"], "kind": "warn", "lvl": r["lvl"], "st": r["st"], "src_n": len(r["src"]),
        "m": "m:" + r["m"], "until": "m:" + r["m"], "from": f"c{r['ch']}", "ch": f"c{r['ch']}", "sp": 0,
        "t": ACT[r["id"]], "sub": r["lt"], "next": [f"saves:{game}:playstation", "walk:" + game],
    })
out = {"by": "guide-saves (tools/saves_entries.py из data/guide/saves.json)", "items": items}
if "--check" not in sys.argv:
    (G / f"entries-saves-{game}.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
print(f"entries-saves-{game}.json: {len(items)} записей")
