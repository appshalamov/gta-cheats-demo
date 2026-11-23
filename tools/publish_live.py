#!/usr/bin/env python3
"""Опубликовать живой контент GTA 6 на сервер live.sbgta.app (Cloudflare KV «sb-live») — без выкладки приложения.

Берёт уже собранные в этом репозитории файлы (сначала tools/gta6_content.py build → build_map, build_news):
  data/news.json          → KV "news"            (картинки → KV "img:…", адреса https://live.sbgta.app/img/…)
  data/map/<игра>.json    → KV "newmap:<игра>"   места и пасхалки, которых нет в выложенном приложении (origin/main),
                                                 и всё с датой добавления dt не старше --days (метка «Новое»)
Перед записью — проверки (стоп с кодом 1): ленты не пустая, у новости 2+ источника и ru/en; в EN нет кириллицы,
в RU нет английских фраз (правила tools/lang_scan.py); подпись кадров — «© Rockstar Games»; ссылок наружу в текстах нет;
у каждой записи «нового на карте» есть координаты; размер ответа ≤ 1 МБ.

Запуск (из корня репозитория):
  python3 tools/publish_live.py              — только проверка и файл выгрузки (ничего не пишет на сервер)
  python3 tools/publish_live.py --local      — записать в локальный KV (wrangler dev, стенд)
  python3 tools/publish_live.py --remote     — записать на сервер (аккаунт app.shalamov, server/live-worker/cf.sh)
Ключи: --days 30, --ref origin/main (что считается выложенным), --out <папка выгрузки>.
"""
import base64
import datetime
import json
import pathlib
import re
import subprocess
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIVE = "https://live.sbgta.app"
NS = "1abcbf3e7b0a401db579ebfe99d68179"   # KV «sb-live», server/live-worker/wrangler.toml
GAMES = ("gta6", "gta5")
MAX_JSON = 1_000_000
sys.path.insert(0, str(ROOT / "tools"))
import lang_scan as LS   # noqa: E402  (правила языков приложения)


def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default


def shipped_ids(ref, game):
    try:
        d = json.loads(subprocess.check_output(["git", "-C", str(ROOT), "show", f"{ref}:data/map/{game}.json"], stderr=subprocess.DEVNULL))
    except Exception:
        return set(), set()
    eggs = {e["id"] for e in d.get("eggs", [])} | {e["id"] for p in d.get("places", []) for e in p.get("eggs", [])}
    return {p["id"] for p in d.get("places", [])}, eggs


class Images:
    """img/map/… из записей → KV img:map/… и абсолютный адрес live.sbgta.app/img/map/…"""
    def __init__(self):
        self.files = {}

    def walk(self, o):
        if isinstance(o, str):
            if o.startswith("img/") and re.search(r"\.(webp|jpe?g|png|avif)$", o):
                f = ROOT / o
                if f.exists():
                    self.files[o[4:]] = f
                    return f"{LIVE}/{o}"
            return o
        if isinstance(o, list):
            return [self.walk(x) for x in o]
        if isinstance(o, dict):
            return {k: self.walk(v) for k, v in o.items()}
        return o


def ru_leaks(text):
    """английские фразы в русском тексте (как lang_scan: имена собственные, «цитаты», лицензии — не утечка)"""
    out = []
    t = re.sub(r"«[^»]*»", "", text or "")
    for chunk in re.findall(r"[A-Za-z][A-Za-z0-9'’&.\- ]*[A-Za-z0-9]", t):
        if LS._descr(chunk):
            out.append(chunk)
    return out


def check_texts(label, ru, en, errs):
    if en and LS.CYR.search(en):
        errs.append(f"{label}: кириллица в EN «{en[:60]}»")
    for c in ru_leaks(ru):
        errs.append(f"{label}: английское в RU «{c}»")
    for v in (ru or "", en or ""):
        if re.search(r"https?://|www\.", v):
            errs.append(f"{label}: ссылка в тексте")


def main():
    days = int(arg("--days", 30))
    ref = arg("--ref", "origin/main")
    mode = "--remote" if "--remote" in sys.argv else "--local" if "--local" in sys.argv else None
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")
    out = pathlib.Path(arg("--out", str(ROOT.parent / "GTA 6 — реальные данные" / "live-публикации" / stamp)))
    out.mkdir(parents=True, exist_ok=True)
    errs, imgs = [], Images()
    cutoff = (datetime.date.today() - datetime.timedelta(days=days)).isoformat()

    # 1) лента
    news = json.loads((ROOT / "data" / "news.json").read_text("utf-8"))
    items = news.get("items") or []
    if not items:
        errs.append("лента пустая")
    for n in items:
        if len(set(n.get("src") or [])) < 2:
            errs.append(f"{n['id']}: меньше 2 источников")
        for k in ("t", "d"):
            v = n.get(k) or {}
            if not v.get("ru") or not v.get("en"):
                errs.append(f"{n['id']}.{k}: нет ru/en")
            check_texts(f"{n['id']}.{k}", v.get("ru"), v.get("en"), errs)
        if n.get("img"):
            n["img"]["credit"] = "© Rockstar Games"
    news = imgs.walk(news)
    news["updated"] = news.get("updated") or datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    kv = {"news": json.dumps(news, ensure_ascii=False, separators=(",", ":"))}

    # 2) новое на карте
    counts = {}
    for g in GAMES:
        f = ROOT / "data" / "map" / f"{g}.json"
        if not f.exists():
            continue
        d = json.loads(f.read_text("utf-8"))
        sp, se = shipped_ids(ref, g)
        if not sp:
            errs.append(f"{g}: не прочитан {ref}:data/map/{g}.json — нечего сравнивать")
            continue
        fresh = lambda o, shipped: o["id"] not in shipped or str(o.get("dt") or "") >= cutoff and bool(o.get("dt"))
        places = [p for p in d.get("places", []) if fresh(p, sp)]
        eggs = [e for e in d.get("eggs", []) if fresh(e, se)]
        for o in places + eggs:
            if not isinstance(o.get("lat"), (int, float)) or not isinstance(o.get("lon"), (int, float)):
                errs.append(f"{g}:{o['id']}: нет координат")
            for k in ("t", "d", "s", "tip", "fun", "why"):
                v = o.get(k)
                if isinstance(v, dict):
                    check_texts(f"{g}:{o['id']}.{k}", v.get("ru"), v.get("en"), errs)
        body = json.dumps(imgs.walk({"game": g, "updated": news["updated"], "places": places, "eggs": eggs}),
                          ensure_ascii=False, separators=(",", ":"))
        if len(body.encode()) > MAX_JSON:
            errs.append(f"{g}: newmap {len(body.encode())} байт > {MAX_JSON}")
        kv[f"newmap:{g}"] = body
        counts[g] = (len(places), len(eggs), sum(1 for p in places if p["id"] not in sp))

    # 3) картинки
    bulk = [{"key": k, "value": v} for k, v in kv.items()]
    size = 0
    for path, f in sorted(imgs.files.items()):
        b = f.read_bytes(); size += len(b)
        bulk.append({"key": f"img:{path}", "value": base64.b64encode(b).decode(), "base64": True})
    (out / "bulk.json").write_text(json.dumps(bulk, ensure_ascii=False), "utf-8")
    (out / "news.json").write_text(kv["news"], "utf-8")
    for g in counts:
        (out / f"newmap_{g}.json").write_text(kv[f"newmap:{g}"], "utf-8")

    print(f"лента: {len(items)} новостей, обновлено {news['updated']}")
    for g, (np_, ne, nn) in counts.items():
        print(f"{g}: новое на карте — мест {np_} (из них не в приложении {nn}), пасхалок {ne}")
    print(f"картинок {len(imgs.files)}, {size // 1024} КБ; выгрузка: {out}")
    if errs:
        print("СТОП publish_live:\n  " + "\n  ".join(errs[:40]))
        sys.exit(1)
    if not mode:
        print("проверка пройдена; записать: --local (стенд) или --remote (сервер)")
        return
    cmd = ["sh", str(ROOT / "server" / "live-worker" / "cf.sh"), "kv", "bulk", "put", str(out / "bulk.json"), "--namespace-id", NS, mode]
    r = subprocess.run(cmd)
    if r.returncode:
        print("СТОП: wrangler kv bulk put не прошёл"); sys.exit(r.returncode)
    if mode == "--remote":
        try:
            h = json.loads(urllib.request.urlopen(urllib.request.Request(f"{LIVE}/health", headers={"User-Agent": "sb-publish"}), timeout=20).read())
            print(f"сервер: {h}")
            if h.get("news") != news["updated"]:
                print("ВНИМАНИЕ: /health показывает другое время ленты (кэш KV до 60 с) — проверить через минуту")
        except Exception as e:
            print(f"ВНИМАНИЕ: {LIVE}/health не ответил ({e}) — Worker sb-live выложен? (sh server/live-worker/cf.sh deploy)")
    print("опубликовано")


if __name__ == "__main__":
    main()
