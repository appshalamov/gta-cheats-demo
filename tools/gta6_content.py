#!/usr/bin/env python3
"""Обновить контент GTA 6 (лента «Новое», места, пасхалки, фото «игра | жизнь») — один повторяемый процесс.

Папка выпуска контента: «GTA 6 — реальные данные/контент <ДД.ММ>/» — туда агенты кладут:
  места.json      — новые места (формат locations_gta6.json + found, commons / commons_hint, frame)
  пасхалки.json   — новые пасхалки (формат easter_eggs_gta6.json + found, commons, frame)
  новости.json    — новости (формат «лента — новости.json»; сливает build_news.py)
Правила: факт — минимум 2 независимых источника; точка в жизни — не дальше 300 м от адреса (сверка Nominatim);
фото жизни — только Wikimedia Commons со свободной лицензией (автор и лицензия — в записи); кадр игры — официальный
скриншот Rockstar с подписью «© Rockstar Games · …»; ссылок наружу в приложении нет.

Команды (запуск из корня репозитория приложения):
  python3 tools/gta6_content.py check  <папка>   — проверка без записи: источники, дубли id, координаты ≤ 300 м, фото
  python3 tools/gta6_content.py merge  <папка>   — то же + запись: места → locations_gta6.json и правки_вручную.json/add,
                                                 пасхалки → правки_вручную.json/egg_add, фото Commons → «карта/img/gta6/»
  python3 tools/gta6_content.py build            — build_map → build_news → check_regress → check_links → check_code
Дальше выкладка: README «Обновить контент GTA 6» в «ДЛЯ НОВОЙ СЕССИИ.md».
"""
import json
import math
import pathlib
import subprocess
import sys
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT.parent
MAPP = PROJ / "Карта локаций GTA — реальный мир"
DATA = MAPP / "данные"
IMG = MAPP / "карта" / "img" / "gta6"
SHOTS = MAPP / "фото" / "игра" / "gta6" / "скриншоты"
MANUAL = DATA / "правки_вручную.json"
UA = {"User-Agent": "SecretBaseContent/1.0 (map data check)"}
MAX_M = 300
FREE = ("CC0", "CC BY", "CC BY-SA", "Public domain", "PD")


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def dist(a, b):
    R = 6371000
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def geocode(q):
    time.sleep(1.1)   # правило Nominatim: не чаще 1 запроса в секунду
    try:
        r = json.loads(get("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + urllib.parse.quote(q)))
        return (float(r[0]["lat"]), float(r[0]["lon"])) if r else None
    except Exception:
        return None


def commons_info(title):
    t = title if title.startswith("File:") else "File:" + title
    u = ("https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo|coordinates&iiprop=url|extmetadata"
         "&iiurlwidth=1600&titles=" + urllib.parse.quote(t))
    p = list(json.loads(get(u))["query"]["pages"].values())[0]
    if "imageinfo" not in p:
        return None
    ii = p["imageinfo"][0]
    m = ii.get("extmetadata", {})
    val = lambda k: (m.get(k) or {}).get("value", "")
    import re
    artist = re.sub(r"<[^>]+>", "", val("Artist")).strip() or "unknown"
    lic = val("LicenseShortName") or ""
    coords = p.get("coordinates") or []
    return {"title": t, "thumb": ii.get("thumburl") or ii["url"], "page": ii.get("descriptionurl", ""), "artist": artist,
            "license": lic, "license_url": val("LicenseUrl"), "geo": (coords[0]["lat"], coords[0]["lon"]) if coords else None}


def commons_photo(rid, title, dry):
    ci = commons_info(title)
    if not ci:
        return None, f"нет файла {title}"
    if not ci["license"].startswith(FREE):
        return None, f"лицензия {ci['license']!r} не свободная"
    rel = f"img/gta6/{rid}_real.jpg"
    if not dry:
        IMG.mkdir(parents=True, exist_ok=True)
        (IMG / f"{rid}_real.jpg").write_bytes(get(ci["thumb"]))
    return {"file": rel, "source": "commons", "page": ci["page"], "credit": f"{ci['artist']} · {ci['license']} · Wikimedia Commons",
            "license": ci["license"], "license_url": ci["license_url"], "commons_title": ci["title"]}, ci["geo"]


def game_photo(rid, frame, dry):
    src = SHOTS / (frame if frame.endswith(".jpg") else frame + ".jpg")
    if not src.exists():
        return None
    rel = f"img/gta6/{rid}_game.jpg"
    if not dry:
        subprocess.run(["sips", "-Z", "1600", "-s", "format", "jpeg", str(src), "--out", str(IMG / f"{rid}_game.jpg")],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return {"file": rel, "source": "rockstar", "credit": f"© Rockstar Games · официальный скриншот {src.stem}", "frame": src.stem}


def existing_ids():
    L = json.loads((DATA / "locations_gta6.json").read_text("utf-8"))
    E = json.loads((DATA / "easter_eggs_gta6.json").read_text("utf-8"))
    man = json.loads(MANUAL.read_text("utf-8")).get("gta6") or {}
    return ({x["id"] for x in L} | {x["id"] for x in man.get("add", [])},
            {x["id"] for x in E} | {x["id"] for x in man.get("egg_add", [])})


def process(folder, dry):
    folder = pathlib.Path(folder)
    have_p, have_e = existing_ids()
    errs, places, eggs = [], [], []
    # места*.json и пасхалки*.json (второй проход агента — пасхалки_2.json и т. п.); уже слитые id пропускаются
    jobs = [(f, "place", have_p, places) for f in sorted(folder.glob("места*.json"))] + \
           [(f, "egg", have_e, eggs) for f in sorted(folder.glob("пасхалки*.json"))]
    for f, kind, have, out in jobs:
        fname = f.name
        if fname.startswith("._"):
            continue
        for it in json.loads(f.read_text("utf-8")):
            rid = it["id"]
            tag = f"{fname}:{rid}"
            if it.get("rumor") or it.get("confidence") == "speculative":
                print(f"  пропуск {tag}: слух/догадка"); continue
            if rid in have or any(x["id"] == rid for x in out):
                continue   # уже в данных — повторный запуск по той же папке безопасен
            if len({urllib.parse.urlparse(u).netloc.replace("www.", "") for u in it.get("sources", [])}) < 2:
                errs.append(f"{tag}: меньше 2 источников с разных сайтов"); continue
            addr = it.get("real_address") or it.get("real_place") or ""
            lat, lon = it.get("lat"), it.get("lon")
            if lat is None or lon is None:
                errs.append(f"{tag}: нет координат"); continue
            a0 = addr.split(" (")[0]
            # geo_check {lat, lon, by} — сверка по другому геокодеру (Photon, OSM-объект), когда Nominatim интерполирует номер дома
            gc = it.get("geo_check")
            g = (gc["lat"], gc["lon"]) if gc else geocode(a0) or (geocode(a0.split(",", 1)[1].strip()) if "," in a0 else None)
            if g and dist(g, (lat, lon)) > MAX_M:
                errs.append(f"{tag}: точка в {dist(g, (lat, lon)):.0f} м от адреса «{addr}» (Nominatim {g[0]:.5f},{g[1]:.5f})"); continue
            if not g:
                print(f"  ! {tag}: адрес не нашёлся в Nominatim — координаты по {it.get('coord_source', '?')}")
            rec = {k: v for k, v in it.items() if k not in ("commons", "commons_hint", "frame", "geo_check")}
            if it.get("commons"):
                ph, geo = commons_photo(rid, it["commons"], dry)
                if ph:
                    rec["photo_real"] = ph
                    if kind == "place":
                        rec["commons_file"] = ph["commons_title"]
                    if geo and dist(geo, (lat, lon)) > 1500:
                        print(f"  ! {tag}: фото Commons снято в {dist(geo, (lat, lon)) / 1000:.1f} км от точки — проверить, то ли место")
                else:
                    errs.append(f"{tag}: фото — {geo}")
            if it.get("frame"):
                gp = game_photo(rid, it["frame"], dry)
                if gp:
                    rec["photo_game"] = gp
                else:
                    errs.append(f"{tag}: нет кадра {it['frame']}")
            gid = it.get("gtadb_id")
            if gid and not rec.get("photo_game"):   # пара gtadb: кадр игры — своя копия с нашего хостинга, жизнь — ссылкой (banned_real)
                try:
                    if not dry:
                        (IMG / f"{rid}_game.jpg").write_bytes(get(f"https://appshalamov.github.io/gta-map-assets/map/photos/6/{gid},ig.jpg"))
                    rec["photo_game"] = {"file": f"img/gta6/{rid}_game.jpg", "source": "gtadb", "credit": f"© Rockstar Games · кадр через gtadb.org ({gid})"}
                    rec.setdefault("photo_real", {"file": f"img/gta6/{rid}_real.jpg", "source": "gtadb",
                                                  "credit": f"фото: gtadb.org ({gid}), CC BY 4.0 — источник снимка не проверен"})
                except Exception as e:
                    errs.append(f"{tag}: кадр gtadb {gid} — {e}")
            if not rec.get("photo_real") and not rec.get("photo_game"):
                print(f"  ! {tag}: без фото — в ленту не попадёт (лента берёт только места с фото)")
            if kind == "place":
                for k, dflt in (("game", "gta6"), ("aliases", []), ("gtadb_id", ""), ("gallery", []), ("game_gallery", []),
                                ("game_image_url", ""), ("commons_file", "")):
                    rec.setdefault(k, dflt)
            out.append(rec)
    return errs, places, eggs


def merge(folder, dry=False):
    errs, places, eggs = process(folder, dry)
    print(f"места: {len(places)}, пасхалки: {len(eggs)}" + (" (проверка, без записи)" if dry else ""))
    if errs:
        print("НЕ ВОШЛО:\n  " + "\n  ".join(errs))
    if dry or not (places or eggs):
        return 1 if errs and not (places or eggs) else 0
    man = json.loads(MANUAL.read_text("utf-8"))
    g = man.setdefault("gta6", {})
    g.setdefault("add", []).extend(places)        # сильнее пересборки finalize
    g.setdefault("egg_add", []).extend(eggs)      # build_map читает сам
    MANUAL.write_text(json.dumps(man, ensure_ascii=False, indent=1), "utf-8")
    if places:
        f = DATA / "locations_gta6.json"
        L = json.loads(f.read_text("utf-8"))
        L.extend(places)
        f.write_text(json.dumps(L, ensure_ascii=False, indent=1), "utf-8")
    print("записано в правки_вручную.json" + (" и locations_gta6.json" if places else ""))
    return 0


def build():
    py = sys.executable
    steps = [[py, "tools/build_map.py"], [py, "tools/build_news.py"], [py, "tools/check_regress.py", "HEAD"],
             [py, "tools/check_links.py"], [py, "tools/check_code.py"]]
    for s in steps:
        print("→", " ".join(s[1:]))
        r = subprocess.run(s, cwd=ROOT)
        if r.returncode:
            print(f"СТОП на {s[1]}"); return r.returncode
    print("готово: дальше build_share.py (если менялись места), VERSION в sw.js, тесты, push_main.sh")
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd in ("check", "merge") and len(sys.argv) > 2:
        sys.exit(merge(sys.argv[2], dry=cmd == "check"))
    if cmd == "build":
        sys.exit(build())
    print(__doc__); sys.exit(2)
