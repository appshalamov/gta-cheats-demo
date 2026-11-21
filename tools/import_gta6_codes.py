#!/usr/bin/env python3
"""Реальные коды GTA 6 → data/gta6.json (после выхода игры 19.11.2026).

Вход — файл проверенных кодов, который ведём руками (по умолчанию
«GTA 5:6 /GTA 6 — реальные данные/коды_gta6.json»):

  {"cheats": [
     {"id": "health", "category": "player", "icon": "❤️",
      "name": {"ru": "Здоровье и броня", "en": "Max Health & Armor"},
      "desc": {"ru": "…", "en": "…"},
      "codes": {"playstation": ["R1", "R2", ...], "xbox": ["RB", "RT", ...], "phone": "1-999-..."},
      "pro": false,
      "sources": [{"url": "https://www.ign.com/...", "date": "2026-11-19"},
                  {"url": "https://www.gamespot.com/...", "date": "2026-11-19"}]}
  ]}

Правила (ТЗ 18.11.2026):
  • у каждого кода ≥ 2 источника с РАЗНЫХ сайтов; утечки и «прогнозы» не источник;
  • платформы на старте — PS5 и Xbox Series (ПК позже: pc = null), телефон — если код есть в игре;
  • названия и описания RU и EN; категория из js/config.js; кнопки — из списка ниже;
  • сомнительное (один источник, нет кнопок, расхождение PS/Xbox) в приложение НЕ идёт — печатается списком «не вошло»
    и пишется в «…/отклонено.json» для отчёта.

Запуск:   python3 tools/import_gta6_codes.py [файл] [--keep-forecast] [--dry]
  --keep-forecast — оставить ещё не подтверждённые коды прогноза ниже проверенных (с пометкой «Прогноз»);
                    по умолчанию в приложении только проверенные.
После — python3 tools/gta6_switch.py --codes live  (сам проверит data/gta6.json).
"""
import json
import pathlib
import re
import sys
import urllib.parse
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT.parent
DEF_IN = PROJ / "GTA 6 — реальные данные" / "коды_gta6.json"
OUT = ROOT / "data" / "gta6.json"

PS = {"X", "O", "S", "T", "L1", "R1", "L2", "R2", "L3", "R3", "←", "→", "↑", "↓", "Options", "Touchpad"}
XB = {"A", "B", "X", "Y", "LB", "RB", "LT", "RT", "LS", "RS", "←", "→", "↑", "↓", "Menu", "View"}
CATS = set(re.findall(r"\{ id: '(\w+)', icon: 'cat", (ROOT / "js" / "config.js").read_text("utf-8")))
# Не источник: сайты-прогнозы «GTA 6 cheats» до выхода, вики-зеркала одной правки, соцсети без видео-доказательства
NOT_SOURCE = re.compile(r"gta6cheat|allgta6cheats|gtabites|gta6info|gta-zone|gta6guide|reddit\.com/r/GTA6leaks|leak", re.I)


def site(url):
    h = urllib.parse.urlparse(url).hostname or ""
    parts = h.lower().split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else h


def check(c):
    why = []
    for k in ("id", "category", "name", "desc", "codes", "sources"):
        if not c.get(k):
            why.append(f"нет поля {k}")
    if why:
        return why
    if c["category"] not in CATS:
        why.append(f"категория {c['category']} не из {sorted(CATS)}")
    for f in ("name", "desc"):
        if not (c[f].get("ru") and c[f].get("en")):
            why.append(f"{f}: нужны ru и en")
    srcs = [s for s in c["sources"] if s.get("url") and not NOT_SOURCE.search(s["url"])]
    sites = {site(s["url"]) for s in srcs}
    if len(sites) < 2:
        why.append(f"источников с разных сайтов {len(sites)} (нужно ≥ 2): {sorted(sites)}")
    k = c["codes"]
    ps, xb, ph = k.get("playstation"), k.get("xbox"), k.get("phone")
    if not (ps and xb) and not ph:
        why.append("нет кода ни для PS5/Xbox, ни для телефона")
    if ps and (bad := [t for t in ps if t not in PS]):
        why.append(f"PS: неизвестные кнопки {bad}")
    if xb and (bad := [t for t in xb if t not in XB]):
        why.append(f"Xbox: неизвестные кнопки {bad}")
    if ps and xb and len(ps) != len(xb):
        why.append(f"PS ({len(ps)}) и Xbox ({len(xb)}) разной длины — перепроверить")
    if bool(ps) != bool(xb):
        why.append("код есть только для одной приставки — перепроверить")
    if ph and not re.fullmatch(r"1-999-[\d-]{4,12}|[\d-]{7,16}", ph):
        why.append(f"номер телефона в странном виде: {ph}")
    return why


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    src = pathlib.Path(args[0]) if args else DEF_IN
    keep = "--keep-forecast" in sys.argv
    data = json.loads(src.read_text("utf-8"))
    ok, rejected, seen = [], [], set()
    for c in data.get("cheats", []):
        why = check(c)
        cid = "g6_" + re.sub(r"^g6_", "", str(c.get("id", "?")))
        if cid in seen:
            why.append("повтор id")
        seen.add(cid)
        if why:
            rejected.append({"id": cid, "name": (c.get("name") or {}).get("ru"), "why": why, "sources": c.get("sources")})
            continue
        k = c["codes"]
        ok.append({"id": cid, "category": c["category"], "icon": c.get("icon") or "🎮",
                   "name": c["name"], "desc": c["desc"], "note": c.get("note"), "pro": bool(c.get("pro")),
                   "status": "live",
                   "codes": {"playstation": k.get("playstation"), "xbox": k.get("xbox"), "pc": None, "phone": k.get("phone")},
                   "media": None,
                   "sources": [{"site": site(s["url"]), "date": s.get("date")} for s in c["sources"]]})
    out = list(ok)
    if keep and OUT.exists():
        old = json.loads(OUT.read_text("utf-8"))
        names = {x["name"]["en"].lower() for x in ok}
        out += [x for x in old.get("cheats", []) if x.get("status") == "forecast" and x["name"]["en"].lower() not in names]
    print(f"проверено: {len(ok)}, не вошло: {len(rejected)}" + (f", прогноз оставлен: {len(out) - len(ok)}" if keep else ""))
    for r in rejected:
        print(f"  ✗ {r['id']} {r['name'] or ''}: {'; '.join(r['why'])}")
    (src.parent / "отклонено.json").write_text(json.dumps(rejected, ensure_ascii=False, indent=1), "utf-8")
    if not ok:
        print("СТОП: ни одного проверенного кода — data/gta6.json не меняю")
        sys.exit(1)
    if "--dry" in sys.argv:
        return
    today = date.today().isoformat()
    OUT.write_text(json.dumps({
        "game": "gta6",
        "source": f"Проверенные коды GTA 6 (PS5, Xbox Series X|S): каждый — минимум по двум независимым источникам, {today}.",
        "source_en": f"Verified GTA 6 codes (PS5, Xbox Series X|S): each confirmed by at least two independent sources, {today}.",
        "updated": today,
        "confidenceLabels": {"high": ["Высокая", "High"], "medium": ["Средняя", "Medium"], "low": ["Низкая", "Low"]},
        "cheats": out,
    }, ensure_ascii=False, indent=1), "utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(out)} кодов. Дальше: python3 tools/gta6_switch.py --codes live")


if __name__ == "__main__":
    main()
