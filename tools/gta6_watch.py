#!/usr/bin/env python3
"""Проверка «появились ли реальные коды и карта GTA 6» (18.11.2026; запускает расписание каждые 4 ч, 7 дней).

Без ключей и входа, только открытые адреса:
  • GTA Wiki (Fandom api.php) — страница «Cheats in GTA VI»: пропала фраза «No confirmed cheats» / шаблон Upcoming;
  • gtadb.org на GitHub — новые наборы плиток GTA 6 (maps/tiles/6) и коммиты; известные наборы — фанатские
    карты до выхода (yanis/aiwe/dupzor/martipk/rickrick), их не берём;
  • официальная карта Леониды на сайте Rockstar — страница грузится скриптом, поэтому её ищет сессия расписания поиском.
Пишет состояние в «GTA 6 — реальные данные/мониторинг/состояние.json» и строку в «мониторинг.md».
Печатает строки «НОВОЕ: …», если что-то изменилось с прошлого запуска.
"""
import hashlib
import json
import pathlib
import re
import urllib.request
from datetime import datetime

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIR = ROOT.parent / "GTA 6 — реальные данные" / "мониторинг"
STATE = DIR / "состояние.json"
LOG = DIR / "мониторинг.md"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) release-check"}
KNOWN_SETS = re.compile(r"^(yanis|aiwe|dupzor|martipk|rickrick)", re.I)


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def wiki():
    t = json.loads(get("https://gta.fandom.com/api.php?action=parse&page=Cheats_in_GTA_VI&prop=wikitext&format=json"))
    w = t["parse"]["wikitext"]["*"]
    rows = len(re.findall(r"^\|-", w, re.M))
    return {"hash": hashlib.sha1(w.encode()).hexdigest()[:12], "no_confirmed": "No confirmed cheats" in w,
            "upcoming": "{{Upcoming" in w, "rows": rows,
            "as_of": (re.search(r"As of ([A-Z][a-z]+ \d+, \d{4})", w) or [None, None])[1]}


def gtadb():
    sets = [x["name"] for x in json.loads(get("https://api.github.com/repos/rolux/gtadb.org/contents/maps/tiles/6"))]
    commits = json.loads(get("https://api.github.com/repos/rolux/gtadb.org/commits?per_page=10"))
    return {"sets": sets, "new_sets": [s for s in sets if not KNOWN_SETS.match(s)],
            "last_commit": commits[0]["commit"]["committer"]["date"] if commits else None,
            "commits": [f"{c['commit']['committer']['date'][:16]} {c['commit']['message'].splitlines()[0][:80]}" for c in commits[:5]]}


def main():
    DIR.mkdir(parents=True, exist_ok=True)
    old = json.loads(STATE.read_text("utf-8")) if STATE.exists() else {}
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    cur, news = {"checked": now}, []
    for name, fn in (("wiki", wiki), ("gtadb", gtadb)):
        try:
            cur[name] = fn()
        except Exception as e:  # noqa: BLE001
            cur[name] = {"error": str(e)[:200]}
    w, ow = cur.get("wiki", {}), old.get("wiki", {})
    if "hash" in w:
        if not w["no_confirmed"]:
            news.append(f"GTA Wiki: на странице читов GTA VI больше нет «No confirmed cheats» (строк таблиц {w['rows']}) — проверить коды")
        elif ow.get("hash") and ow["hash"] != w["hash"]:
            news.append("GTA Wiki: страница читов GTA VI изменилась (коды пока не подтверждены)")
    g, og = cur.get("gtadb", {}), old.get("gtadb", {})
    if "sets" in g:
        fresh = [s for s in g["new_sets"] if s not in (og.get("new_sets") or [])]
        if fresh:
            news.append(f"gtadb: новые наборы плиток GTA 6 {fresh} — проверить, что карта из вышедшей игры (FAQ/README gtadb)")
        if og.get("last_commit") and og["last_commit"] != g["last_commit"]:
            news.append(f"gtadb: новые коммиты, последний {g['commits'][0]}")
    STATE.write_text(json.dumps(cur, ensure_ascii=False, indent=1), "utf-8")
    line = f"- {now}: " + ("; ".join(news) if news else "без изменений") + \
        f" (wiki: {'нет подтверждённых' if w.get('no_confirmed') else w.get('error') or 'ЕСТЬ ИЗМЕНЕНИЯ'}; gtadb наборы: {', '.join(g.get('sets', [])) or g.get('error')})\n"
    if not LOG.exists():
        LOG.write_text("# Мониторинг: реальные коды и карта GTA 6\n\nПишет tools/gta6_watch.py (расписание каждые 4 ч до 26.11.2026).\n\n", "utf-8")
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line)
    for n in news:
        print("НОВОЕ:", n)
    print(json.dumps(cur, ensure_ascii=False)[:1500])


if __name__ == "__main__":
    main()
