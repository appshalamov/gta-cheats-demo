#!/usr/bin/env python3
"""Языки в данных карты не смешиваются (Игорь 21.11.2026; data-tails 28.11: «Leonida Straits» показывал в RU
«Straits of Florida south of the Lower Keys»). Статика без браузера — проходит ВСЕ точки обеих игр:
места, пасхалки (и вложенные в места), точки сообщества gtadb, слои коллекций (подписи в js/map.js) и ленту новостей.

  RU: то, что видит русский интерфейс (nr||n, ar||a, gr||g, pn||p, gar||ga, у gtadb rn[id]||name и rr[id]||real, {ru} в текстах) — без
      английских фраз. Правило то же, что у теста lang_mix (tools/lang_scan.py: стоп-слова, строчные английские
      слова-пояснения; имена собственные, бренды, улицы, «ёлочки», лицензии — латиницей можно).
  EN: n/a/g/p/ga/{en} и точки gtadb — без кириллицы (строки авторства кадров/фото не считаются).

Новая находка: перевод в tools/names_ru.json (англ. строка → русская), пересборка tools/build_map.py.
Запуск: python3 tools/lang_check.py [--json отчёт.json]. Итог — «СМЕШЕНИЙ: N», код выхода 1, если N > 0.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from lang_scan import CYR, CREDIT, EN_STOP, LATIN_OK, PROPER, _descr  # noqa: E402  (одно правило с тестом lang_mix)

RU_NAMES = json.loads((ROOT / "tools" / "names_ru.json").read_text("utf-8"))
URL = re.compile(r"https?://\S+|\b[\w-]+\.(?:com|org|net|app|io|gg|tv|wiki)\b\S*")
# поля, которые интерфейс не показывает как текст (ссылки, файлы, ключи, авторство)
SKIP = {"src", "id", "pg", "pr", "gl", "gg", "pairs", "gm", "img", "f", "file", "thumb", "url", "yt", "credit", "by", "cv",
        "m", "lic", "sn", "key", "k", "page", "v", "vid", "mv", "sr"}


def ru_text_bad(s):
    """Русский текст — как видимый текст в lang_mix: после имён собственных, «ёлочек», лицензий и ссылок не должно
    остаться английских служебных слов (the, and, of, your…). Отдельные иностранные слова в кавычках-пояснениях можно."""
    t = LATIN_OK.sub(" ", PROPER.sub(" ", URL.sub(" ", CREDIT.sub(" ", s))))
    return [t[max(0, m.start() - 25):m.end() + 25].strip() for m in EN_STOP.finditer(t)]


def walk_bi(o, path, out, where):
    """Тексты {ru, en} на любой глубине: RU без английских фраз, EN без кириллицы."""
    if isinstance(o, dict):
        if isinstance(o.get("ru"), str) and isinstance(o.get("en"), str):
            bad = ru_text_bad(o["ru"])
            if bad:
                out.append({"lang": "ru", "where": where, "path": path, "text": o["ru"][:120], "bad": bad[:3]})
            if CYR.search(o["en"]):
                out.append({"lang": "en", "where": where, "path": path, "text": o["en"][:120]})
        for k, v in o.items():
            if k not in SKIP:
                walk_bi(v, f"{path}.{k}", out, where)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            walk_bi(v, f"{path}[{i}]", out, where)


def name_bad(v):
    return isinstance(v, str) and v and v not in RU_NAMES and _descr(v)


def check_points(game, out):
    d = json.loads((ROOT / "data" / "map" / f"{game}.json").read_text("utf-8"))
    n = 0
    items = [("place", p) for p in d["places"]] + [("egg", e) for e in d["eggs"]] + \
            [("egg", e) for p in d["places"] for e in p.get("eggs") or []]
    for kind, x in items:
        n += 1
        w = f"{game}:{kind}:{x.get('id')}"
        # RU-поле показывается вместо английского: nr/ar/gr/pn; без них — само английское
        for f, fr in (("n", "nr"), ("a", "ar"), ("g", "gr"), ("p", "pn"), ("ga", "gar")):
            v = x.get(fr) or x.get(f)
            if isinstance(x.get(fr), str):
                bad = ru_text_bad(x[fr])
                if bad:
                    out.append({"lang": "ru", "where": w, "path": fr, "text": x[fr][:120], "bad": bad[:3]})
            elif name_bad(v):
                out.append({"lang": "ru", "where": w, "path": f, "text": v[:120], "fix": "tools/names_ru.json"})
            if isinstance(x.get(f), str) and CYR.search(x[f]):
                out.append({"lang": "en", "where": w, "path": f, "text": x[f][:120]})
        walk_bi({k: v for k, v in x.items() if k not in SKIP and k not in ("eggs",)}, "", out, w)
    return n


def check_gtadb(game, out):
    fp = ROOT / "data" / "map" / f"gtadb_{game}.json"
    d = json.loads(fp.read_text("utf-8"))
    ru = {1: d.get("rn") or {}, 3: d.get("rr") or {}}   # русские имя и реальное место (tools/names_ru.py gtadb)
    for q in d["points"]:
        w = f"{game}:gtadb:{q[0]}"
        for i, f in ((1, "name"), (2, "district"), (3, "real")):
            v = q[i] or ""
            if CYR.search(v):
                out.append({"lang": "en", "where": w, "path": f, "text": v[:120]})
            if q[0] in ru.get(i, {}):
                bad = ru_text_bad(ru[i][q[0]])
                if bad:
                    out.append({"lang": "ru", "where": w, "path": f + "_ru", "text": ru[i][q[0]][:120], "bad": bad[:3]})
            elif name_bad(v):
                out.append({"lang": "ru", "where": w, "path": f, "text": v[:120], "fix": "tools/names_ru.json"})
    return len(d["points"])


R_PAIR = re.compile(r"R\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)")


def check_layers(out):
    """Слои коллекций: подписи — в js/map.js (GL, GL_EGG через R('ru', 'en')), точки — data/map/layers/*.json."""
    src = (ROOT / "js" / "map.js").read_text("utf-8")
    a, b = src.find("const GL = {"), src.find("const GL_EGG = {")
    block = src[a:src.find("\n};", a)] + src[b:src.find("\n};", b)]
    kinds = set(re.findall(r"^\s{2}(\w+):\s*\{", src[a:src.find("\n};", a)], re.M))
    for ru, en in R_PAIR.findall(block):
        bad = ru_text_bad(ru)
        if bad:
            out.append({"lang": "ru", "where": "js/map.js GL", "path": "R", "text": ru[:120], "bad": bad[:3]})
        if CYR.search(en):
            out.append({"lang": "en", "where": "js/map.js GL", "path": "R", "text": en[:120]})
    n = 0
    for fp in sorted((ROOT / "data" / "map" / "layers").glob("*.json")):
        if fp.name.startswith("._") or fp.name == "images.json":
            continue
        for p in json.loads(fp.read_text("utf-8")).get("points") or []:
            n += 1
            if p[2] not in kinds:
                out.append({"lang": "?", "where": f"layers/{fp.name}", "path": "kind", "text": str(p[2])})
    return n


def main():
    out, cnt = [], {}
    for g in ("gta6", "gta5"):
        cnt[g] = check_points(g, out)
        cnt[g + " gtadb"] = check_gtadb(g, out)
    cnt["слои"] = check_layers(out)
    news = json.loads((ROOT / "data" / "news.json").read_text("utf-8"))
    for it in news.get("items") or []:
        walk_bi({k: v for k, v in it.items() if k not in SKIP}, "", out, f"news:{it.get('id')}")
    cnt["новости"] = len(news.get("items") or [])
    for x in out:
        print(f"{x['lang'].upper():2} {x['where']} .{x['path'].lstrip('.')}: {x['text']}" + (f"  ← {x['bad']}" if x.get("bad") else ""))
    if "--json" in sys.argv:
        pathlib.Path(sys.argv[sys.argv.index("--json") + 1]).write_text(json.dumps(out, ensure_ascii=False, indent=1), "utf-8")
    print("проверено: " + ", ".join(f"{k} {v}" for k, v in cnt.items()))
    print(f"СМЕШЕНИЙ: {len(out)} (RU {sum(x['lang'] == 'ru' for x in out)}, EN {sum(x['lang'] == 'en' for x in out)})")
    return 1 if out else 0


if __name__ == "__main__":
    sys.exit(main())
