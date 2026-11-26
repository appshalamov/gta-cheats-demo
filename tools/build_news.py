#!/usr/bin/env python3
"""Лента «Новое» на Главной: data/news.json из общего списка новостей.

Вход:  «GTA 6 — реальные данные/лента — новости.json» (накопительный, правится руками или агентами):
       [{id, game, date YYYY-MM-DD, t{ru,en}, d{ru,en}, src[имена изданий], urls[для проверки, в приложение НЕ идут],
         frame: имя официального скриншота Rockstar (фото/игра/gta6/скриншоты/<frame>.jpg) или путь к своему кадру,
         credit, key?: "place:gta6:<id>" | "egg:gta6:<id>" — кнопка «Показать на карте"}]
Выход: data/news.json {updated, items[]} — без ссылок (правило «не уводить из приложения»),
       кадры img/map/<game>/news/<id>.webp (640×360) и t/<id>.webp (240×135), как у соседних фото мест.

Проверки (стоп с кодом 1): у новости ≥ 2 источника; дата не в будущем; ru и en заполнены; кадр найден; key указывает на
существующее место/пасхалку в data/map/<game>.json.

Запуск: python3 tools/build_news.py [--max 30]
"""
import datetime
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT.parent
SRC = PROJ / "GTA 6 — реальные данные" / "лента — новости.json"
SHOTS = PROJ / "Карта локаций GTA — реальный мир" / "фото" / "игра" / "gta6" / "скриншоты"
OUT = ROOT / "data" / "news.json"
FFMPEG = pathlib.Path.home() / "bin" / "ffmpeg"
SIZES = (("", 640, 360, 72), ("t/", 240, 135, 70))


def frame_path(n):
    f = n.get("frame") or ""
    p = pathlib.Path(f)
    if not p.is_absolute():
        p = SHOTS / (f if f.endswith((".jpg", ".png", ".webp")) else f + ".jpg")
    return p


def to_webp(src, dst, w, h, q):
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return
    vf = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
    subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(src), "-vf", vf, "-c:v", "libwebp", "-quality", str(q), str(dst)], check=True)


def main():
    mx = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 30
    items = json.loads(SRC.read_text("utf-8"))
    today = datetime.date.today().isoformat()
    places = {}
    errs, out = [], []
    for n in items:
        if n.get("rumor") or n.get("off"):
            continue
        nid, g = n["id"], n.get("game", "gta6")
        if len(set(n.get("src") or [])) < 2:
            errs.append(f"{nid}: меньше 2 источников")
        if not (n.get("date") or "") or n["date"] > today:
            errs.append(f"{nid}: дата {n.get('date')!r}")
        for k in ("t", "d"):
            if not (n.get(k) or {}).get("ru") or not (n.get(k) or {}).get("en"):
                errs.append(f"{nid}: нет {k}.ru/en")
        rec = {"id": nid, "game": g, "date": n["date"], "t": n["t"], "d": n["d"], "src": n["src"]}
        if n.get("frame"):
            fp = frame_path(n)
            if not fp.exists():
                errs.append(f"{nid}: нет кадра {fp}")
            else:
                base = f"img/map/{g}/news/"
                for sub, w, h, q in SIZES:
                    to_webp(fp, ROOT / base / sub / f"{nid}.webp", w, h, q)
                # подпись — без языка («© Rockstar Games»): «официальный скриншот …» давал русский в EN (23.11.2026)
                # своё фото из жизни (Commons) — подпись автора и лицензии из записи (26.11.2026: новости о находках сообщества)
                rec["img"] = {"file": f"{base}{nid}.webp", "thumb": f"{base}t/{nid}.webp", "credit": n.get("credit") or "© Rockstar Games"}
        if n.get("key"):
            kind, kg, kid = n["key"].split(":", 2)
            if kg not in places:
                d = json.loads((ROOT / "data" / "map" / f"{kg}.json").read_text("utf-8"))
                ids = {("place", p["id"]) for p in d["places"]} | {("egg", e["id"]) for e in d["eggs"]}
                ids |= {("egg", e["id"]) for p in d["places"] for e in p.get("eggs", [])}
                places[kg] = ids
            if (kind, kid) not in places[kg]:
                errs.append(f"{nid}: key {n['key']} не найден в data/map/{kg}.json")
            rec["key"] = n["key"]
        out.append(rec)
    if errs:
        print("СТОП build_news:\n  " + "\n  ".join(errs))
        sys.exit(1)
    out.sort(key=lambda x: x["date"], reverse=True)
    # updated — время сборки (UTC, ISO): в приложении «обновлено N мин назад»
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    OUT.write_text(json.dumps({"updated": stamp, "items": out[:mx]}, ensure_ascii=False, separators=(",", ":")), "utf-8")
    print(f"data/news.json: {len(out[:mx])} новостей, кадров {sum(1 for x in out if 'img' in x)}")


if __name__ == "__main__":
    main()
