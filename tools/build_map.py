#!/usr/bin/env python3
"""Собирает данные вкладки «Карта» из проекта «Карта локаций GTA — реальный мир».

Берёт проверенные файлы, если они уже есть (данные/locations_<game>.json, easter_eggs_<game>.json —
с русскими текстами и фото), иначе — черновые (_сырьё/canonical_* / raw_*, тексты EN).
Пишет компактные:  data/map/<game>.json  (места + пасхалки)
                   data/map/gtadb_<game>.json  (слой «все точки сообщества», gtadb.org, CC BY 4.0)
Фото из «карта/img/<game>/» копирует в img/map/<game>/.

Запуск:  python3 tools/build_map.py
"""
import json
import pathlib
import re
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT.parent / "Карта локаций GTA — реальный мир"
DATA = SRC / "данные"
RAW = DATA / "_сырьё"
OUT = ROOT / "data" / "map"
IMG_OUT = ROOT / "img" / "map"

GAMES = {
    "gta6": {"center": [25.79, -80.21], "zoom": 10, "places": ["locations_gta6.json", "_сырьё/canonical_locations_gta6.json"],
             "eggs": ["easter_eggs_gta6.json", "_сырьё/canonical_eggs_gta6.json"], "gtadb": "VI"},
    "gta5": {"center": [34.05, -118.33], "zoom": 10, "places": ["locations_gta5.json", "_сырьё/canonical_locations_gta5.json", "_сырьё/raw_locations_gta5.json"],
             "eggs": ["easter_eggs_gta5.json", "_сырьё/canonical_eggs_gta5.json", "_сырьё/raw_eggs_gta5.json"], "gtadb": "V"},
}
MAX_TXT = 320


def first_existing(names):
    for n in names:
        p = DATA / n
        if p.exists():
            return p
    return None


def num(v):
    try:
        return round(float(v), 5)
    except (TypeError, ValueError):
        return None


def short(s, n=MAX_TXT):
    s = str(s or "").split(" | ")[0].strip()
    s = re.sub(r"\s+", " ", s)
    if len(s) <= n:
        return s
    cut = s[:n]
    dot = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    return (cut[:dot + 1] if dot > n * 0.5 else cut.rsplit(" ", 1)[0] + "…")


def bi(item, key):
    """{ru, en}: ru — из <key>_ru, если есть; en — из <key>."""
    en = short(item.get(key))
    ru = short(item.get(key + "_ru")) if item.get(key + "_ru") else ""
    return {"ru": ru or en, "en": en or ru}


def src0(item):
    s = item.get("sources")
    if isinstance(s, str):
        s = re.findall(r"https?://[^'\"\s,\]]+", s)
    return (s or [None])[0]


def media(item):
    m = item.get("game_media") or item.get("where_in_media") or []
    if isinstance(m, str):
        m = [x for x in re.split(r"[|;]", m)]
    seen, out = set(), []
    for x in m:
        x = str(x).strip()
        if x and x not in seen and not x.startswith("GTADB"):
            seen.add(x)
            out.append(short(x, 90))
    return out[:4]


def photo(item, game, key="photo_real"):
    p = item.get(key) or (item.get("photo") if key == "photo_real" else None)
    if not isinstance(p, dict) or not p.get("file"):
        return None
    src = SRC / "карта" / p["file"]
    if not src.exists():
        return None
    dst = IMG_OUT / game / src.name
    thumb = IMG_OUT / game / "t" / src.name
    thumb.parent.mkdir(parents=True, exist_ok=True)
    # два размера (sips есть в любой macOS): 640 px для карточки, 240 px — миниатюра для ленты
    for out, size, q in ((dst, 640, 70), (thumb, 240, 60)):
        if not out.exists() or out.stat().st_mtime < src.stat().st_mtime:
            subprocess.run(["sips", "-Z", str(size), "-s", "format", "jpeg", "-s", "formatOptions", str(q), str(src), "--out", str(out)],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return {"file": f"img/map/{game}/{src.name}", "thumb": f"img/map/{game}/t/{src.name}", "credit": p.get("credit", "")}


def build(game, cfg):
    pf, ef = first_existing(cfg["places"]), first_existing(cfg["eggs"])
    places, eggs = [], []
    for i, it in enumerate(json.loads(pf.read_text("utf-8")) if pf else []):
        lat, lon = num(it.get("lat")), num(it.get("lon"))
        if lat is None or lon is None:
            continue
        has_sum = bool(it.get("summary") or it.get("summary_ru"))
        summary = bi(it, "summary") if has_sum else bi(it, "match_evidence")
        srcs = it.get("sources") or []
        if isinstance(srcs, str):
            srcs = re.findall(r"https?://[^'\"\s,\]]+", srcs)
        place = {
            "id": it.get("id") or f"{game}-p{i}",
            "g": it.get("game_name", ""), "r": it.get("game_region", ""),
            "n": it.get("real_name", ""), "a": it.get("real_address", "") or it.get("real_city", ""),
            "lat": lat, "lon": lon, "c": it.get("category", ""), "cf": it.get("confidence", "likely"),
            "ac": it.get("access", ""), "v": it.get("verified", True) is not False and pf.name.startswith("locations_"),
            "s": summary, "why": bi(it, "match_evidence") if has_sum else None,
            "tip": bi(it, "visit_tips"), "fun": bi(it, "trivia") if (it.get("trivia") or it.get("trivia_ru")) else None,
            "m": media(it), "src": [u for u in srcs if str(u).startswith("http")][:3],
            "pg": photo(it, game, "photo_game"), "pr": photo(it, game, "photo_real"),
            "gl": [{"url": g["url"], "thumb": g.get("thumb") or g["url"], "credit": g.get("credit", "")}
                   for g in (it.get("gallery") or []) if g.get("url")][:5],
        }
        places.append({k: v for k, v in place.items() if v not in (None, "", [], {"ru": "", "en": ""})})
    for i, it in enumerate(json.loads(ef.read_text("utf-8")) if ef else []):
        lat, lon = num(it.get("lat")), num(it.get("lon"))
        if lat is None or lon is None:
            continue
        eggs.append({
            "id": it.get("id") or f"{game}-e{i}",
            "t": bi(it, "title"), "d": bi(it, "description"), "p": it.get("real_place", ""),
            "lat": lat, "lon": lon, "cf": it.get("confidence", "likely"), "m": media(it), "src": src0(it),
            "pg": photo(it, game, "photo_game"), "pr": photo(it, game, "photo_real"),
        })
    data = {"game": game, "center": cfg["center"], "zoom": cfg["zoom"],
            "source": pf.name if pf else None, "places": places, "eggs": eggs}
    (OUT / f"{game}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), "utf-8")

    layer = json.loads((DATA / f"gtadb_layer_{game}.json").read_text("utf-8"))
    pts = [[p["id"], p.get("name") or "", p.get("district") or p.get("region") or "", p.get("real") or "",
            num(p["lat"]), num(p["lon"]), p.get("type") or "", 1 if p.get("ig") else 0, 1 if p.get("rl") else 0] for p in layer
           if not p.get("leak_tag") and num(p.get("lat")) is not None]
    (OUT / f"gtadb_{game}.json").write_text(json.dumps({"game": cfg["gtadb"], "points": pts}, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"{game}: мест {len(places)} ({pf.name if pf else '—'}), пасхалок {len(eggs)}, точек gtadb {len(pts)}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for g, cfg in GAMES.items():
        build(g, cfg)


if __name__ == "__main__":
    main()
