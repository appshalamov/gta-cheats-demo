#!/usr/bin/env python3
"""Указатель «Гида по игре» — data/guide/index-<игра>.json (26.11.2026, «Решение Fable — система гида.md», раздел 3).

Оглавление, Главная, поиск, «Дальше» и «Продолжить» читают только указатель (js/guide-core.js). Файлы функций остаются у хозяев,
связь — через ключи и id миссий. Источники записей:
  1) пасхалки и баги с инструкцией — egg.how в data/map/<игра>.json (собирает build_map.py guide_fields) → kind egg | bug;
  2) готовые записи функций — data/guide/entries-<функция>-<игра>.json: {"items":[запись, …]} или любой data/guide/*.json с массивом "index"
     (gta6-settings.json у guide-settings) (их пишут сессии settings, walk, saves,
     endings своими скриптами; новая функция = новый файл, этот скрипт не трогать).
Запись: k, kind (egg|bug|tip|warn|fork|ending|set|save), t{ru,en}, sub{ru,en}, m, ch, from, until, dur, sp (0|1|2), lvl (1|2),
        st (own|ok|one|dispute|rumor), src_n, v, upd, chk, plat, place, steps_n, min, fr, free, kw{ru[],en[]}, next[], img_src[].

Сборка останавливается (код 1), если: нет ru или en; числа в языках разные; ключ next ведёт в никуда; next пуст; st=ok при src_n < 2;
у ending с одним источником st не rumor; у bug нет v и chk; kw < 8 фраз у egg, bug, set; внешняя ссылка в тексте; миссия from/until/m
не найдена в data/guide/missions.json (если база есть); с --prod — кадр с src=ref (чужой) у записи.
У bug при новой версии игры (data/guide/game.json → v) статус сам становится «перепроверяем после патча» (recheck=1).

Запуск: python3 tools/build_guide_index.py [--game gta6] [--prod] [--check]
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
GUIDE = ROOT / "data" / "guide"
KINDS = {"egg", "bug", "tip", "warn", "fork", "ending", "set", "save"}
KW_MIN = 8
URL = re.compile(r"https?://|www\.", re.I)
NUM = re.compile(r"\d[\d ,.]*\d|\d")


def nums(s):
    return sorted(x.replace(" ", "").replace(",", "").replace(".", "") for x in NUM.findall(s or ""))


def from_eggs(game):
    p = ROOT / "data" / "map" / f"{game}.json"
    if not p.exists():
        return []
    d = json.loads(p.read_text("utf-8"))
    eggs = list(d.get("eggs", [])) + [e for pl in d.get("places", []) for e in pl.get("eggs", [])]
    out = []
    for e in eggs:
        h = e.get("how")
        if not h or not h.get("st"):
            continue
        kind = "bug" if e.get("k") == "bug" else "egg"
        sn = e.get("sn") or []
        st = "own" if h.get("self") else ("ok" if len(sn) >= 2 else "one")
        allst = [s for pa in h.get("pa") or [{"st": h["st"]}] for s in pa["st"]]
        imgs = sorted({s.get("img", {}).get("src") for s in allst if isinstance(s.get("img"), dict)} - {None})
        paths = [{"id": pa["id"], "n": len(pa["st"]), **({"min": pa["min"]} if pa.get("min") else {}), **({"bug": 1} if pa.get("bug") else {})}
                 for pa in h.get("pa") or []]
        out.append({
            "k": f"guide:{game}:{e['id']}", "kind": kind, "t": h.get("ta") or e.get("t"), "sub": h.get("rw"),
            "st": st, "src_n": len(sn), "upd": e.get("dt"), "chk": h.get("chk"), "place": f"egg:{game}:{e['id']}",
            "steps_n": len(h["st"]), "min": h.get("min"), "fr": h.get("fr"), "kw": e.get("kw") or {}, "next": e.get("next") or [],
            **({"v": e["v_game"]} if e.get("v_game") else {}), **({"img_src": imgs} if imgs else {}), "sp": e.get("sp", 0),
            **({"paths": paths} if paths else {}),
        })
    return out


def from_entries(game):
    """entries-<функция>-<игра>.json {"items":[…]} и любой data/guide/*.json с массивом "index" (так сдаёт guide-settings: gta6-settings.json)."""
    out, seen = [], set()
    for f in sorted(GUIDE.glob("*.json")):
        if f.name.startswith("._") or f.name.startswith("index-") or f.name == "game.json":
            continue
        try:
            d = json.loads(f.read_text("utf-8"))
        except Exception:
            continue
        rows = d.get("items", []) if f.name.startswith("entries-") and f.name.endswith(f"-{game}.json") else d.get("index") if isinstance(d, dict) and isinstance(d.get("index"), list) else []
        for r in rows:
            if (r.get("k") or "").split(":")[1:2] in ([game], []) and r.get("k") not in seen:
                seen.add(r.get("k")); out.append({**r, "_file": f.name})
    return out


def missions(game):
    p = GUIDE / "missions.json"
    if not p.exists():
        return None
    d = json.loads(p.read_text("utf-8"))
    if d.get("game", game) != game:
        return None
    return {"m:" + m["id"] for m in d.get("m", [])} | {c["id"] for c in d.get("ch", [])}


def validate(items, game, prod):
    errs, keys = [], {r["k"] for r in items}
    mis = missions(game)
    gj = json.loads((GUIDE / "game.json").read_text("utf-8")).get(game, {}) if (GUIDE / "game.json").exists() else {}
    gv = gj.get("v")
    pending = set(gj.get("pending") or [])   # ключи, которые сдают другие функции (до слияния веток) — предупреждение, в --prod стоп
    for r in items:
        k, where = r.get("k", "?"), r.get("_file", "egg.how")
        if r.get("kind") not in KINDS:
            errs.append(f"{k}: неизвестный kind {r.get('kind')!r} ({where})")
        for f in ("t", "sub"):
            v = r.get(f)
            if f == "t" or v:
                if not isinstance(v, dict) or not v.get("ru") or not v.get("en"):
                    errs.append(f"{k}: нет {f}.ru/en ({where})")
                elif nums(v["ru"]) != nums(v["en"]):
                    errs.append(f"{k}: числа в {f} различаются между языками")
                elif URL.search(v["ru"] + v["en"]):
                    errs.append(f"{k}: внешняя ссылка в {f}")
        if not r.get("next"):
            errs.append(f"{k}: пустой next — «Дальше» обязателен (скилл seriya-uderzhanie)")
        for n in r.get("next") or []:
            if n not in keys and not re.match(r"^(place|egg|db):(gta6|gta5):", n) and n not in ("progress", f"walk:{game}", f"endings:{game}"):
                if n in pending and not prod:
                    print(f"  ! {k}: next {n!r} ждёт слияния ветки другой функции (game.json pending)")
                else:
                    errs.append(f"{k}: next {n!r} не найден в указателе")
        if r.get("st") == "ok" and (r.get("src_n") or 0) < 2:
            errs.append(f"{k}: st=ok при src_n={r.get('src_n')}")
        if r.get("kind") == "ending" and (r.get("src_n") or 0) < 2 and r.get("st") != "rumor":
            errs.append(f"{k}: концовка с одним источником — только st=rumor")
        if r.get("kind") == "bug":
            if not (r.get("v") and r.get("chk")):
                errs.append(f"{k}: у бага нет версии игры (v) или даты перепроверки (chk)")
            elif gv and r["v"] != gv:
                r["recheck"] = 1
        if r.get("kind") in ("egg", "bug", "set"):
            kw = r.get("kw") or {}
            n = len(kw.get("ru") or []) + len(kw.get("en") or [])
            if n < KW_MIN:
                errs.append(f"{k}: ключевых фраз kw {n} < {KW_MIN} (поиск RU/EN, решение 09)")
        if mis is not None:
            for f in ("m", "from", "until"):
                if r.get(f) and r[f] not in mis:
                    errs.append(f"{k}: {f}={r[f]!r} нет в базе миссий")
        if prod and "ref" in (r.get("img_src") or []):
            errs.append(f"{k}: чужие кадры (img.src=ref) в сборке прода — только своя запись или с разрешением автора")
    return errs


def main():
    a = sys.argv[1:]
    game = a[a.index("--game") + 1] if "--game" in a else "gta6"
    prod, check = "--prod" in a, "--check" in a
    items = from_eggs(game) + from_entries(game)
    seen, dup = set(), []
    for r in items:
        if r["k"] in seen:
            dup.append(r["k"])
        seen.add(r["k"])
    errs = validate(items, game, prod) + [f"{k}: ключ повторяется" for k in dup]
    if errs:
        print("СТОП build_guide_index:\n  " + "\n  ".join(errs))
        sys.exit(1)
    for r in items:
        r.pop("_file", None)
    out = {"game": game, "n": len(items), "items": items}
    if not check:
        GUIDE.mkdir(parents=True, exist_ok=True)
        (GUIDE / f"index-{game}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), "utf-8")
        # game.json → has: какие файлы гида есть у игры (ядро не запрашивает отсутствующие — без 404 в приложении)
        gp = GUIDE / "game.json"
        gj = json.loads(gp.read_text("utf-8")) if gp.exists() else {}
        gj.setdefault(game, {})["has"] = {"index": bool(items), "missions": missions(game) is not None}
        gp.write_text(json.dumps(gj, ensure_ascii=False, indent=1), "utf-8")
    from collections import Counter
    print(f"data/guide/index-{game}.json: {len(items)} записей " + ", ".join(f"{k} {v}" for k, v in Counter(r['kind'] for r in items).items())
          + (" (проверка, без записи)" if check else ""))


if __name__ == "__main__":
    main()
