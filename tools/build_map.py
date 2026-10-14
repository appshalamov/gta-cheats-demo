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
import urllib.parse
import urllib.request

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
VIEWS = DATA / "виды_360.json"   # id места/пасхалки → ссылка Google Street View (или готовый {pano, heading, pitch, fov})


def parse_view(v):
    """Ссылка Street View → {lat, lon, pano, heading, pitch, fov}.
    Вид ссылки: …/maps/@25.79,-80.13,3a,75y,90h,95t/data=…!1s<ID панорамы>!2e0…  (t = наклон + 90)."""
    if isinstance(v, dict):
        out = {k: v[k] for k in ("lat", "lon", "pano", "heading", "pitch", "fov") if v.get(k) not in (None, "")}
    else:
        url = str(v).strip()
        if re.match(r"https?://(maps\.app\.goo\.gl|goo\.gl)/", url):   # короткая ссылка из «Поделиться» — раскрыть
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Mozilla/5.0"})
            url = urllib.request.urlopen(req, timeout=20).geturl()
        url = urllib.parse.unquote(url)
        out = {}
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", url)
        if m:
            out["lat"], out["lon"] = round(float(m[1]), 6), round(float(m[2]), 6)
        for key, rx in (("fov", r",([\d.]+)y"), ("heading", r",([\d.]+)h"), ("pitch", r",([\d.]+)t")):
            m = re.search(r"@[^/]*" + rx, url)
            if m:
                out[key] = float(m[1])
        if "pitch" in out:
            out["pitch"] -= 90
        m = re.search(r"!1s([A-Za-z0-9_\-]{10,})!2e0", url)   # !2e0 — панорама Google (свои фото людей !2e10 не берём)
        if m:
            out["pano"] = m[1]
    lim = {"heading": (-180, 360), "pitch": (-90, 90), "fov": (10, 100)}
    for k, (lo, hi) in lim.items():
        if k in out:
            out[k] = round(min(hi, max(lo, float(out[k]))), 1)
    return out if ("pano" in out or "heading" in out) else None


REGION = {"gta5": (32.3, -124.6, 42.1, -114.0), "gta6": (24.3, -87.8, 31.1, -79.8)}   # Калифорния / Флорида


def region_gate(game, places, eggs):
    """Стоп-кран: точка вне региона игры (испорченная широта и т. п.) в приложение не попадает.
    Законные исключения (отсылки к роликам из других штатов) — список «вне_региона» в данные/правки_вручную.json."""
    f = DATA / "правки_вручную.json"
    allowed = set(((json.loads(f.read_text("utf-8")) if f.exists() else {}).get(game) or {}).get("вне_региона") or [])
    b = REGION[game]
    bad = [f"{x['id']} ({x['lat']}, {x['lon']})" for x in places + eggs
           if x["id"] not in allowed and not (b[0] <= x["lat"] <= b[2] and b[1] <= x["lon"] <= b[3])]
    if bad:
        raise SystemExit(f"СТОП {game}: точки вне региона игры — исправьте в данные/правки_вручную.json (fix) "
                         f"или внесите в «вне_региона», если это законная отсылка:\n  " + "\n  ".join(bad))


GAME_CATS = [("w", r"Ammu-?Nation"),
             ("c", r"Los Santos Customs|LS Customs|Benny'?s|Premium Deluxe|Simeon|Legendary Motorsport|Southern San Andreas Super Autos|Auto Exotic|Beeker"),
             ("h", r"Fleeca|Pacific Standard|Blaine County Savings|Union Depository|Vangelico"),
             ("s", r"Binco|Suburban|Ponsonbys|Discount Store|Herr Kutz|Beach Combover|Bob Mulet|Hair on Hawick|O'Sheas Barbers|Barber|Tattoo")]


def game_cat(name):
    """Категория для игрока по названию в игре: w — оружие, c — машины, h — ограбления, s — магазины (одежда, стрижки, тату)."""
    for code, rx in GAME_CATS:
        if re.search(rx, name or "", re.I):
            return code
    return None


def attach_cats(places, pts):
    n = 0
    for pl in places:
        c = game_cat(pl.get("g"))
        if c:
            pl["gc"] = c; n += 1
    for q in pts:
        c = game_cat(q[1])
        if c:
            while len(q) < 12:
                q.append([] if len(q) == 9 else None)
            q[12:] = [c]; n += 1
    print(f"  категории для игрока: {n}")


LEAK_WORDS = re.compile(r"\bleak|утечк|placeholder", re.I)


def leak_reason(it, game):
    """Признак утечки: утечка в самом названии («2022 leak trivia», «leaked placeholder») или фото взято с точки gtadb
    с тегом утечки (L1–L8, EVENTS). Описание, где утечка упомянута как исключённая, — не признак."""
    v = 5 if game == "gta5" else 6
    lm = json.loads((SRC / "источники" / "gtadb.org (CC BY 4.0)" / f"landmarks_gta{v}.json").read_text("utf-8"))
    leaky = lambda gid: gid in lm and any(t.lower() == "events" or re.fullmatch(r"l\d+", t.lower()) for t in lm[gid][6])
    if LEAK_WORDS.search(str(it.get("title") or "") + " " + str(it.get("id") or "")):
        return "утечка в названии"
    for k in ("photo_game", "photo_real"):
        m = re.search(r"\((L\d+)\)", str((it.get(k) or {}).get("credit") or ""))
        if m and leaky(m.group(1)):
            return f"фото из утечки gtadb {m.group(1)}"
    return ""


def attach_ingame(game, cfg, places, eggs, pts):
    """«Где в игре» (просьба Игоря 14.10.2026: «как это в GTA найти»): координаты места на карте игры.
    gm = [x, y, точность]: 0 — своя точка gtadb, 1 — соседняя пара gtadb, 2 — оценка по 6 ближайшим опорным точкам
    (реальные ↔ игровые координаты из gtadb, медианная ошибка ≈ 200 м в GTA 5 и ≈ 115 м в GTA 6). ga — адрес в игре.
    Точкам слоя gtadb — 12-й элемент [x, y]."""
    v = 5 if game == "gta5" else 6
    lm = json.loads((SRC / "источники" / "gtadb.org (CC BY 4.0)" / f"landmarks_gta{v}.json").read_text("utf-8"))
    ctrl = [(k, it[1], it[4]) for k, it in lm.items() if it[1] and it[4]
            and not any(t.lower() == "events" or re.fullmatch(r"l\d+", t.lower()) for t in it[6])]
    def est(lat, lon):
        near = sorted(((meters((lat, lon), (rl[0], rl[1])), ig) for _, ig, rl in ctrl), key=lambda t: t[0])[:6]
        ws = [1 / max(d, 50) ** 2 for d, _ in near]
        return [round(sum(w * ig[0] for w, (_, ig) in zip(ws, near)) / sum(ws), 1), round(sum(w * ig[1] for w, (_, ig) in zip(ws, near)) / sum(ws), 1)]
    def gid_of(x):
        for i in x.get("_pid") or []:
            if i in lm and lm[i][1]:
                return i
        return None
    n = {0: 0, 1: 0, 2: 0}
    for x in places + eggs + [e for pl in places for e in pl.get("eggs", [])]:
        own = x.get("_gtadb")
        if x.get("_gxy"):   # место в игре задано вручную (правки_вручную.json: game_xy / game_addr / game_gid)
            x["gm"] = [round(x["_gxy"][0], 1), round(x["_gxy"][1], 1), 0] + ([x["_ggid"]] if x.get("_ggid") else [])
            x["ga"] = x.get("_gaddr") or ""
            n[0] += 1
            continue
        if own in lm and lm[own][1]:
            k, acc = own, 0
        else:
            k, acc = gid_of(x), 1
        if k:
            x["gm"] = [round(lm[k][1][0], 1), round(lm[k][1][1], 1), acc, k]
            x["ga"] = lm[k][0]
        else:
            x["gm"] = est(x["lat"], x["lon"]) + [2]
        n[x["gm"][2]] += 1
    for q in pts:
        it = lm.get(q[0])
        if it and it[1]:
            while len(q) < 11:
                q.append([] if len(q) == 9 else None)
            q[11:] = [[round(it[1][0], 1), round(it[1][1], 1)]]
    print(f"  где в игре: точно {n[0]}, по соседней паре {n[1]}, оценка {n[2]}")


def attach_approx(game, places, eggs):
    """Примерные фото (данные/фото_примерные.json, выбраны агентами по просьбе Игоря 14.10.2026): только там, где своих нет.
    Помечаются ap=1 — в карточке подпись «≈ рядом» (снято поблизости, не точно это место)."""
    f = DATA / "фото_примерные.json"
    sel = (json.loads(f.read_text("utf-8")) if f.exists() else {}).get(game) or {}
    n = 0
    for x in places + eggs + [e for pl in places for e in pl.get("eggs", [])]:
        s = sel.get(x["id"]) or {}
        if s.get("game") and not (x.get("pg") or x.get("gg")):
            x["pg"] = {"url": s["game"]["url"], "credit": s["game"]["credit"], "ap": 1}; n += 1
        if s.get("real") and not (x.get("pr") or x.get("gl")) and not banned_real(s["real"]):
            x["pr"] = {"url": s["real"]["url"], "thumb": s["real"].get("thumb") or s["real"]["url"], "credit": s["real"]["credit"], "ap": 1}; n += 1
    if n:
        print(f"  примерных фото: {n}")


def photo_rights_gate(game, places, eggs):
    """Стоп сборки, если в приложение попадает запрещённое фото из жизни (см. banned_real) или пара с ним."""
    bad = []
    for x in places + eggs + [e for pl in places for e in pl.get("eggs", [])]:
        for ph in [x.get("pr")] + (x.get("gl") or []) + [p.get("r") for p in x.get("pairs") or []]:
            if ph and banned_real(ph):
                bad.append(f"{x['id']}: {(ph.get('url') or ph.get('file') or '')[-60:]}")
    if bad:
        raise SystemExit(f"{game}: СТОП — фото из жизни без права показа ({len(bad)}): " + "; ".join(bad[:5]))


def gtadb_fixes(game):
    f = DATA / "правки_вручную.json"
    return (json.loads(f.read_text("utf-8")).get(game) or {}).get("gtadb_fix") or {} if f.exists() else {}


def load_views(game):
    if not VIEWS.exists():
        return {}
    raw = json.loads(VIEWS.read_text("utf-8")).get(game) or {}
    views = {}
    for pid, v in raw.items():
        try:
            pv = parse_view(v)
        except Exception as err:   # сеть/формат — место останется со ссылкой по координатам
            print(f"  ! вид 360° {pid}: {err}")
            continue
        if pv:
            views[pid] = pv
        else:
            print(f"  ! вид 360° {pid}: в ссылке нет ни ID панорамы, ни направления")
    return views


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


def banned_real(p):
    """Реальные фото, которые нельзя показывать (14.10.2026, ресёрч прав + своя выборка): снимки из gtadb без автора —
    в основном скриншоты Google Street View / Google Earth («© Google» на кадре); условия Google запрещают их показ."""
    s = " ".join(str(p.get(k) or "") for k in ("source", "credit", "url", "file", "page")).lower()
    who = " ".join(str(p.get(k) or "") for k in ("source", "credit")).lower()   # «google» — только в подписи: на Commons есть
    return "gtadb" in s or ",rl.jpg" in s or "google" in who                    # законные фото зданий Google (Lifeinvader)


def photo(item, game, key="photo_real"):
    p = item.get(key) or (item.get("photo") if key == "photo_real" else None)
    if not isinstance(p, dict) or not p.get("file"):
        return None
    if key == "photo_real" and banned_real(p):
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


def gal(item, game, key, limit=5):
    """Список фото галереи: локальные файлы (file, относительно «карта/») копируются как photo(), ссылки (url) — как есть."""
    out = []
    for g in (item.get(key) or []):
        if key == "gallery" and banned_real(g):
            continue
        if g.get("file"):
            ph = photo({"photo_real": g}, game)
            if ph:
                out.append(ph)
        elif g.get("url"):
            out.append({"url": g["url"], "thumb": g.get("thumb") or g["url"], "credit": g.get("credit", "")})
    return out[:limit]


def meters(a, b):
    import math
    R = 6371000; p1, p2 = math.radians(a[0]), math.radians(b[0])
    x = math.sin(math.radians(b[0] - a[0]) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(b[1] - a[1]) / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))


STOPW = {"the", "and", "of", "in", "at", "los", "santos", "vice", "city", "santa", "monica", "miami", "beach", "pier", "former",
         "real", "new", "old", "south", "north", "east", "west", "street", "st", "drive", "dr", "ave", "avenue", "blvd"}


def toks(*xs):
    return {w for x in xs for w in re.findall(r"[a-z0-9]+", str(x or "").lower()) if len(w) > 2 and w not in STOPW}


def dedupe(places, eggs, pts):
    """Без дублей на карте:
    1) точка gtadb, которая повторяет наше место (тот же gtadb_id; или ≤ 25 м; или ≤ 80 м и общее слово в названии), — убирается;
    2) точки gtadb ближе 15 м друг к другу схлопываются в одну (остальные названия — «здесь же»);
    3) пасхалка ≤ 60 м от места, к которому относится (общее слово) или ≤ 25 м от любого места, — показывается в карточке места,
       а не отдельной точкой.
    Возвращает (eggs_left, pts_left, отчёт)."""
    rep_ = {"places_merged": 0, "gtadb_dup": 0, "gtadb_stacked": 0, "eggs_into_place": 0}
    # 0) два наших места про одну и ту же реальную точку (≤ 20 м и общее слово в реальном названии) — оставить лучшее
    # _hadr — фото из жизни было, но снято по праву (banned_real): слияние не должно меняться от снятия фото,
    # иначе пропадают id карточек (избранное пользователей) — 14.10.2026 так пропал бы Davis Fire Station
    score = lambda pl: (pl.get("v", False), bool(pl.get("pg")) + bool(pl.get("pr") or pl.get("_hadr")), len(pl.get("gl", [])), pl.get("cf") == "confirmed")
    places.sort(key=score, reverse=True)
    kept = []
    for pl in places:
        twin = next((k for k in kept if meters((pl["lat"], pl["lon"]), (k["lat"], k["lon"])) <= 20 and toks(pl["n"]) & toks(k["n"])), None)
        if twin:
            rep_["places_merged"] += 1
            twin.setdefault("alias", []).append(pl["g"])
        else:
            kept.append(pl)
    places[:] = kept
    own_ids = {pl.get("_gtadb") for pl in places if pl.get("_gtadb")}
    keep = []
    for q in pts:
        here = (q[4], q[5])
        hit = next((pl for pl in places if pl.get("_gtadb") == q[0]), None)
        if not hit:
            for pl in places:
                d = meters(here, (pl["lat"], pl["lon"]))
                if d <= 25 or (d <= 80 and toks(q[1], q[3]) & toks(pl["g"], pl["n"])):
                    hit = pl; break
        dup = hit is not None
        cat = game_cat(q[1])
        if dup and cat and game_cat(hit.get("g")) != cat:   # точку для игрока (оружие, машины…) не теряем, если место-дубль её не несёт
            dup = False
        if dup:
            rep_["gtadb_dup"] += 1
        else:
            keep.append(q)
    # схлопывание стопок: представитель — с обеими фото
    keep.sort(key=lambda q: -(q[7] + q[8]))
    groups = []
    for q in keep:
        if game_cat(q[1]):   # точки для игрока не схлопываем в стопки
            groups.append([q]); continue
        for g in groups:
            if meters((q[4], q[5]), (g[0][4], g[0][5])) <= 15:
                g.append(q); break
        else:
            groups.append([q])
    pts_left = []
    for g in groups:
        head = list(g[0])
        also = [x[1] or x[3].split(",")[0] for x in g[1:] if (x[1] or x[3])][:8]
        head.append(also)
        rep_["gtadb_stacked"] += len(g) - 1
        pts_left.append(head)
    eggs_left = []
    for e in eggs:
        best = None
        for k, pl in enumerate(places):
            d = meters((e["lat"], e["lon"]), (pl["lat"], pl["lon"]))
            related = bool(toks(e["t"].get("en"), e.get("p")) & toks(pl["g"], pl["n"]))
            if d <= 25 or (d <= 60 and related):
                if best is None or d < best[0]:
                    best = (d, k)
        if best:
            places[best[1]].setdefault("eggs", []).append(e)
            rep_["eggs_into_place"] += 1
        else:
            eggs_left.append(e)
    return eggs_left, pts_left, rep_


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
            "m": media(it), "src": [u for u in srcs if str(u).startswith("http") and not str(u).endswith((",rl.jpg", ",ig.jpg"))][:3],
            "pg": photo(it, game, "photo_game"), "pr": photo(it, game, "photo_real"),
            "gl": gal(it, game, "gallery"), "gg": gal(it, game, "game_gallery", 4),
            "_gtadb": it.get("gtadb_id") or "",
            "_gxy": it.get("game_xy"), "_gaddr": it.get("game_addr"), "_ggid": it.get("game_gid"),
            "_hadr": 1 if isinstance(it.get("photo_real"), dict) and banned_real(it["photo_real"]) else 0,
        }
        places.append({k: v for k, v in place.items() if v not in (None, "", [], {"ru": "", "en": ""})})
    skipped = []
    for i, it in enumerate(json.loads(ef.read_text("utf-8")) if ef else []):
        lat, lon = num(it.get("lat")), num(it.get("lon"))
        if lat is None or lon is None:
            continue
        # в приложение — только проверенное и без утечек (14.10.2026 в прод попали непроверенная пасхалка из списка утечки
        # 2022 года и опровергнутый слух: finalize --provisional добавлял непроверенные записи канона)
        why = "не проверена" if it.get("verified") is False else leak_reason(it, game)
        if why:
            skipped.append(f"{it.get('id')} ({why})"); continue
        eggs.append({
            "id": it.get("id") or f"{game}-e{i}",
            "t": bi(it, "title"), "d": bi(it, "description"), "p": it.get("real_place", ""),
            "lat": lat, "lon": lon, "cf": it.get("confidence", "likely"), "m": media(it), "src": src0(it),
            "pg": photo(it, game, "photo_game"), "pr": photo(it, game, "photo_real"), "gg": gal(it, game, "game_gallery", 4),
        })
    if skipped:
        print(f"  пасхалки не в приложение: {len(skipped)} — " + ", ".join(skipped[:6]) + (" …" if len(skipped) > 6 else ""))
    layer = json.loads((DATA / f"gtadb_layer_{game}.json").read_text("utf-8"))
    gfix = gtadb_fixes(game)   # проверенные вручную точки gtadb (у части адрес вида «Wilshire Boulevard, CA» без номера — координаты примерные)
    for x in layer:
        if x["id"] in gfix:
            x.update({k: v for k, v in gfix[x["id"]].items() if k in ("lat", "lon", "real")})
    pts = [[p["id"], p.get("name") or "", p.get("district") or p.get("region") or "", p.get("real") or "",
            num(p["lat"]), num(p["lon"]), p.get("type") or "", 1 if p.get("ig") else 0, 0] for p in layer
           if not p.get("leak_tag") and num(p.get("lat")) is not None]
    gviews = {gid: parse_view(v["view"]) for gid, v in gfix.items() if v.get("view")}
    # Пары gtadb «кадр игры + фото из жизни»: фото из жизни там — скриншоты Street View (14.10.2026), их не показываем.
    # Кадры игры из пар идут в игровую галерею, id пар — в _pid (для «Где в игре»). Слайдер «Сравнить» вернётся,
    # когда у пары будет фото из жизни со свободной лицензией (Commons, своё фото пользователя).
    raw = lambda gid, k: f"https://raw.githubusercontent.com/rolux/gtadb.org/main/map/photos/{5 if game == 'gta5' else 6}/{gid},{k}.jpg"
    lay = {x["id"]: x for x in layer if x.get("ig") and x.get("rl") and not x.get("leak_tag")}
    def pairs_for(lat, lon, names, own="", wide=False):
        # своя привязка gtadb — всегда; соседние пары — с общим словом в названии в 120 м (район/пляж/парк/природа — 1,5 км).
        # 14.10.2026: при 60 м уточнение точки на 3–6 м отрезало пары у Del Perro Pier.
        ids = [own] if own in lay else []
        rad = 1500 if wide else 120
        for x in sorted(lay.values(), key=lambda x: meters((lat, lon), (x["lat"], x["lon"]))):
            if len(ids) >= 4 or meters((lat, lon), (x["lat"], x["lon"])) > rad:
                break
            if x["id"] not in ids and toks(x["name"], x["real"]) & toks(*names):
                ids.append(x["id"])
        return ids
    def add_pair_shots(x, ids):
        if not ids:
            return
        x["_pid"] = ids
        have = {ph.get("url") or ph.get("file") for ph in [x.get("pg")] + (x.get("gg") or []) if ph}
        extra = [{"url": raw(i, "ig"), "thumb": raw(i, "ig"), "credit": f"© Rockstar Games · gtadb.org ({i})"} for i in ids if raw(i, "ig") not in have]
        if extra:
            x["gg"] = ((x.get("gg") or []) + extra)[:6]
    for pl in places:
        add_pair_shots(pl, pairs_for(pl["lat"], pl["lon"], (pl["g"], pl["n"]), pl.get("_gtadb", ""), pl.get("c") in ("neighborhood", "beach", "park", "nature")))
    for e in eggs:
        add_pair_shots(e, pairs_for(e["lat"], e["lon"], (e["t"].get("en"), e.get("p"))))
    region_gate(game, places, eggs)
    attach_approx(game, places, eggs)
    eggs, pts, rep_ = dedupe(places, eggs, pts)
    for q in pts:   # вид 360° точки gtadb — 11-й элемент (после «здесь же»)
        if q[0] in gviews and gviews[q[0]]:
            while len(q) < 10:
                q.append([])
            q[10:] = [gviews[q[0]]]
    views = load_views(game)
    used = set()
    for x in places + eggs + [e for pl in places for e in pl.get("eggs", [])]:
        if x["id"] in views:
            x["view"] = views[x["id"]]; used.add(x["id"])
    for pid in sorted(set(views) - used):
        print(f"  ! вид 360° {pid}: такого места нет в {game}")
    if views:
        print(f"  виды 360°: {len(used)} из {len(views)}")
    attach_ingame(game, cfg, places, eggs, pts)
    attach_cats(places, pts)
    for x in places + eggs + [e for pl in places for e in pl.get("eggs", [])]:
        for k in ("_gtadb", "_gxy", "_gaddr", "_ggid", "_pid", "_hadr"):
            x.pop(k, None)
    photo_rights_gate(game, places, eggs)
    data = {"game": game, "center": cfg["center"], "zoom": cfg["zoom"],
            "source": pf.name if pf else None, "places": places, "eggs": eggs}
    (OUT / f"{game}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), "utf-8")
    (OUT / f"gtadb_{game}.json").write_text(json.dumps({"game": cfg["gtadb"], "points": pts}, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"{game}: мест {len(places)} ({pf.name if pf else '—'}), с кадрами игры из пар gtadb {sum(1 for x in places if any('gtadb.org (L' in (g.get('credit') or '') for g in x.get('gg') or []))}, пасхалок отдельно {len(eggs)}, точек gtadb {len(pts)} · без дублей: {rep_}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for g, cfg in GAMES.items():
        build(g, cfg)


if __name__ == "__main__":
    main()
