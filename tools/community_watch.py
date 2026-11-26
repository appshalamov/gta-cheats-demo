#!/usr/bin/env python3
"""Слежение за находками сообщества GTA 6 → очередь кандидатов (26.11.2026, «Гид по игре», функция 1).

Без ключей и входа, только открытые адреса (список — tools/community_sources.json): официальные Rockstar,
Reddit (r/GTA6 и соседние — через архив arctic-shift, напрямую без ключа закрыт), Bluesky, YouTube (RSS каналов), Telegram (превью t.me/s/<канал>), новостные сайты (RSS),
GTA Wiki (Fandom api.php, последние правки страниц), Google News RSS.

Сырые находки в приложение НЕ идут. Конвейер:
  1) run      — опрос источников → новые записи в очередь (status=new), похожие записи склеиваются в одну находку
               (тема = значимые слова заголовка); находка, которую повторили ≥ 2 независимых источника, получает status=verify;
  2) verify   — сессия/агент проверяет по ТЗ («контент 26.11 — находки сообщества/ТЗ агентам.md»): ≥ 2 источника, шаги «как получить»;
  3) card     — `promote <id>` кладёт черновик пасхалки-инструкции в папку контента (формат egg_add + how) → gta6_content.py merge;
  4) news+map — build_map (метка на карте), строка в «лента — новости.json» с key egg:gta6:<id> → build_news (новость);
  5) publish  — только после «да» Игоря: выкладка приложения (push_sha.sh) или publish_live.py --remote.

Команды (из корня репозитория приложения):
  python3 tools/community_watch.py run [--only <id,id>] [--dry]   опрос, печать «НОВОЕ: …» для находок с ≥ 2 источниками
  python3 tools/community_watch.py list [--status new|verify|card|rejected|all] [--top 30]
  python3 tools/community_watch.py set <id> <status> [заметка]   ручная отметка (rejected, card, published, watch)
  python3 tools/community_watch.py promote <id> [папка]          черновик карточки для проверки
  python3 tools/community_watch.py digest [--hours 24]           сводка для расписания/Игоря (markdown)
  python3 tools/community_watch.py test                          проверка разбора на встроенных образцах (без сети)
"""
import datetime as dt
import email.utils
import hashlib
import html
import json
import pathlib
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT.parent
SOURCES = ROOT / "tools" / "community_sources.json"
DIR = PROJ / "GTA 6 — реальные данные" / "мониторинг" / "находки сообщества"
QUEUE = DIR / "очередь.json"
LOG = DIR / "журнал.md"
CONTENT = PROJ / "GTA 6 — реальные данные"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
STATUSES = ("new", "watch", "verify", "card", "published", "rejected")

# — что считаем «находкой»: игра + слово про секрет/как получить (RU/EN). Остальное (продажи, рецензии, слухи о DLC) — мимо.
GAME = re.compile(r"\b(gta\s*(6|vi)\b|grand theft auto\s*(6|vi)\b|leonida|vice city|гта\s*6|gta6)", re.I)
FIND = re.compile(r"(easter egg|secret|hidden|how to (get|find|unlock|steal)|where to find|location of|rare\b|found\b|discover|"
                  r"mystery|ufo|bigfoot|ghost|glitch|money (method|trick)|unlock|collectible|treasure|"
                  r"пасхалк|секрет|скрыт|тайн|как (получить|найти|угнать|достать|открыть)|где найти|нашли|редк|нло|призрак|клад)", re.I)
NOISE = re.compile(r"(review|sales|sold|units|stock|price|preorder|pre-order|trailer \d.*reaction|leak|rumou?r|"
                   r"обзор|продаж|предзаказ|утечк|слух)", re.I)
STOP = set("the a an of to in on and or for is are with how get find gta 6 vi grand theft auto from this that you your it at by "
           "new all just about guide where what why secret secrets hidden easter egg eggs location locations best "
           "как в на и с по для это все где что гта найти получить пасхалка пасхалки секрет секреты".split())


def now():
    return dt.datetime.now(dt.timezone.utc)


def get(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.8,ru;q=0.6"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def iso(s):
    """Дата из RSS/Atom/JSON → ISO UTC; не разобрали — сейчас."""
    if s in (None, ""):
        return now().strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(s, (int, float)):
        return dt.datetime.fromtimestamp(s, dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        d = email.utils.parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            d = dt.datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        except ValueError:
            return now().strftime("%Y-%m-%dT%H:%M:%SZ")
    if d.tzinfo is None:
        d = d.replace(tzinfo=dt.timezone.utc)
    return d.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clean(s):
    s = re.sub(r"<[^>]+>", " ", html.unescape(s or ""))
    return re.sub(r"\s+", " ", s).strip()


def local(tag):
    return tag.rsplit("}", 1)[-1]


# ── разбор форматов ──
def parse_feed(text):
    """RSS 2.0 и Atom (YouTube, Reddit .rss, сайты, Google News). → [{title, url, date, text, views}]"""
    out = []
    root = ET.fromstring(text.encode("utf-8") if isinstance(text, str) else text)
    for el in root.iter():
        if local(el.tag) not in ("item", "entry"):
            continue
        rec = {"title": "", "url": "", "date": None, "text": "", "views": None}
        for ch in el.iter():
            n = local(ch.tag)
            if n == "title" and not rec["title"]:
                rec["title"] = clean(ch.text)
            elif n == "link" and not rec["url"]:
                rec["url"] = (ch.get("href") or ch.text or "").strip()
            elif n in ("pubDate", "published", "updated", "date") and not rec["date"]:
                rec["date"] = ch.text
            elif n in ("description", "summary", "content", "encoded") and not rec["text"]:
                rec["text"] = clean(ch.text)[:600]
            elif n == "statistics" and ch.get("views"):      # YouTube media:statistics
                rec["views"] = int(ch.get("views"))
        rec["date"] = iso(rec["date"])
        if rec["title"] and rec["url"]:
            out.append(rec)
    return out


def parse_reddit_json(text):
    data = json.loads(text)
    out = []
    for c in (data.get("data") or {}).get("children", []):
        d = c.get("data") or {}
        if d.get("stickied"):
            continue
        out.append({"title": clean(d.get("title")), "url": "https://www.reddit.com" + d.get("permalink", ""),
                    "date": iso(d.get("created_utc")), "text": clean(d.get("selftext"))[:600],
                    "score": d.get("score"), "comments": d.get("num_comments"), "author": d.get("author")})
    return out


def parse_telegram(text, channel):
    """Превью канала t.me/s/<канал>: посты с текстом и датой."""
    out = []
    for m in re.finditer(r'data-post="([^"]+)".*?(?=data-post="|\Z)', text, re.S):
        block, post = m.group(0), m.group(1)
        body = re.search(r'class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>', block, re.S)
        when = re.search(r'<time[^>]+datetime="([^"]+)"', block)
        views = re.search(r'class="tgme_widget_message_views">([^<]+)<', block)
        txt = clean(body.group(1)) if body else ""
        if not txt:
            continue
        v = None
        if views:
            s = views.group(1).strip().upper()
            mult = 1000 if s.endswith("K") else 1_000_000 if s.endswith("M") else 1
            try:
                v = int(float(s.rstrip("KM")) * mult)
            except ValueError:
                v = None
        out.append({"title": txt[:160], "url": f"https://t.me/{post}", "date": iso(when.group(1) if when else None),
                    "text": txt[:600], "views": v})
    return out


def parse_arctic(text):
    """Архив Reddit arctic-shift (Reddit напрямую без ключа закрыт: .rss 404/429, .json 403 — проверка 26.11.2026)."""
    out = []
    for d in json.loads(text).get("data") or []:
        out.append({"title": clean(d.get("title")), "url": "https://www.reddit.com" + (d.get("permalink") or ""),
                    "date": iso(d.get("created_utc")), "text": clean(d.get("selftext"))[:600],
                    "score": d.get("score"), "comments": d.get("num_comments"), "author": d.get("author")})
    return [x for x in out if x["title"] and x["url"].endswith("/")]


def parse_bluesky(text):
    out = []
    for p in json.loads(text).get("posts") or []:
        txt = clean((p.get("record") or {}).get("text"))
        h, rk = (p.get("author") or {}).get("handle", ""), (p.get("uri") or "").rsplit("/", 1)[-1]
        if txt and h and rk:
            out.append({"title": txt[:160], "url": f"https://bsky.app/profile/{h}/post/{rk}", "date": iso(p.get("indexedAt")),
                        "text": txt[:600], "score": (p.get("likeCount") or 0) + 2 * (p.get("repostCount") or 0), "author": h})
    return out


def parse_fandom_rc(text, base):
    out = []
    for r in (json.loads(text).get("query") or {}).get("recentchanges", []):
        t = r.get("title", "")
        out.append({"title": f"{t} (правка вики: {clean(r.get('comment'))[:80]})", "url": base + "/wiki/" + t.replace(" ", "_"),
                    "date": iso(r.get("timestamp")), "text": clean(r.get("comment")), "wiki": True})
    return out


def fetch(src):
    t = src["type"]
    text = get(src["url"])
    if t in ("rss", "atom"):
        return parse_feed(text)
    if t == "reddit_json":
        return parse_reddit_json(text)
    if t == "arctic":
        return parse_arctic(text)
    if t == "bluesky":
        return parse_bluesky(text)
    if t == "telegram":
        return parse_telegram(text, src["url"].rstrip("/").rsplit("/", 1)[-1])
    if t == "fandom_rc":
        return parse_fandom_rc(text, re.match(r"https?://[^/]+", src["url"]).group(0))
    raise ValueError(f"неизвестный тип {t}")


# ── отбор, тема, склейка ──
def is_find(src, it):
    """scope=gta6 — источник целиком про GTA 6 (r/GTA6, запрос «GTA 6 …» в Google News); general — игра должна быть в тексте."""
    hay = f"{it['title']} {it.get('text', '')}"
    if src.get("scope") != "gta6" and not GAME.search(hay) and not it.get("wiki"):
        return False
    if NOISE.search(it["title"]) and not FIND.search(it["title"]):
        return False
    return bool(FIND.search(hay))


def tokens(s):
    s = re.sub(r"[^\w\s'-]", " ", (s or "").lower())
    return {w for w in s.split() if len(w) > 2 and w not in STOP and not w.isdigit()}


def topic(title):
    return sorted(tokens(title))


def same(a, b):
    ta, tb = set(a), set(b)
    if not ta or not tb:
        return False
    inter = ta & tb
    return len(inter) >= 2 and len(inter) / min(len(ta), len(tb)) >= 0.5


def score(src, it):
    s = src.get("weight", 1.0)
    s += 1.5 * len(FIND.findall(it["title"]))
    if it.get("score"):
        s += min(4, (it["score"] or 0) / 500)
    if it.get("views"):
        s += min(4, (it["views"] or 0) / 50000)
    return round(s, 2)


def load_queue():
    if QUEUE.exists():
        return json.loads(QUEUE.read_text("utf-8"))
    return {"updated": None, "items": [], "seen": []}


def save_queue(q):
    DIR.mkdir(parents=True, exist_ok=True)
    q["seen"] = q["seen"][-5000:]
    q["updated"] = now().strftime("%Y-%m-%dT%H:%M:%SZ")
    QUEUE.write_text(json.dumps(q, ensure_ascii=False, indent=1), "utf-8")


def merge(q, src, it):
    """Добавить запись в очередь: та же тема у другого источника — в ту же находку (это и есть второй источник)."""
    key = hashlib.sha1(it["url"].encode()).hexdigest()[:12]
    if key in q["seen"]:
        return None
    q["seen"].append(key)
    tp = topic(it["title"].rsplit(" - ", 1)[0] if src.get("kind") == "gnews" else it["title"])
    hit = next((c for c in q["items"] if c["status"] not in ("rejected", "published") and same(c["topic"], tp)), None)
    pub = it["title"].rsplit(" - ", 1)[1].strip() if src.get("kind") == "gnews" and " - " in it["title"] else src["name"]
    ref = {"src": src["id"], "name": src["name"], "pub": pub, "kind": src.get("kind", ""), "title": it["title"], "url": it["url"],
           "date": it["date"], "lang": src.get("lang", "en"), **{k: it[k] for k in ("score", "views", "author") if it.get(k) is not None}}
    if hit:
        hit["refs"].append(ref)
        hit["score"] = round(max(hit["score"], score(src, it)) + 1, 2)
        # независимые = разные издания/авторы (у Google News издание — после « - » в заголовке), а не разные ленты
        pubs = {r.get("pub") or r["name"] for r in hit["refs"]}
        if hit["status"] == "new" and len(pubs) >= 2:
            hit["status"] = "verify"
            return ("verify", hit)
        return ("more", hit)
    cid = "c" + now().strftime("%m%d") + "-" + key[:6]
    c = {"id": cid, "title": it["title"], "topic": tp, "first": it["date"], "added": now().strftime("%Y-%m-%dT%H:%M:%SZ"),
         "status": "verify" if src.get("official") else "new", "score": score(src, it), "refs": [ref], "note": ""}
    q["items"].append(c)
    return ("new", c)


def run(only=None, dry=False):
    srcs = [s for s in json.loads(SOURCES.read_text("utf-8")) if s.get("on", True)]
    if only:
        srcs = [s for s in srcs if s["id"] in only]
    q = load_queue()
    stats, alerts, errors = {}, [], []
    for s in srcs:
        try:
            items = fetch(s)
        except Exception as e:  # noqa: BLE001 — один источник упал, остальные работают
            errors.append(f"{s['id']}: {str(e)[:120]}")
            continue
        n = 0
        for it in items:
            if not is_find(s, it):
                continue
            r = merge(q, s, it)
            if r:
                n += 1
                if r[0] == "verify":
                    alerts.append(r[1])
        stats[s["id"]] = f"{len(items)}→{n}"
        time.sleep(s.get("pause", 1.2))
    if not dry:
        save_queue(q)
        stamp = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
        DIR.mkdir(parents=True, exist_ok=True)
        if not LOG.exists():
            LOG.write_text("# Находки сообщества GTA 6 — журнал слежения\n\nПишет tools/community_watch.py. "
                           "Очередь — очередь.json; «verify» = тему повторили ≥ 2 источника, пора проверять.\n\n", "utf-8")
        with LOG.open("a", encoding="utf-8") as f:
            f.write(f"- {stamp}: источников {len(stats)}, новых записей {sum(int(v.split('→')[1]) for v in stats.values())}, "
                    f"к проверке {len(alerts)}" + (f"; ошибки: {'; '.join(errors)}" if errors else "") + "\n")
            for c in alerts:
                f.write(f"  - К ПРОВЕРКЕ {c['id']}: {c['title']} ({len(c['refs'])} ист.: {', '.join(sorted({r['name'] for r in c['refs']}))})\n")
    for c in alerts:
        print(f"НОВОЕ: {c['id']} {c['title']} — {len({r.get('pub') or r['name'] for r in c['refs']})} ист.")
    print("источники:", ", ".join(f"{k} {v}" for k, v in stats.items()))
    if errors:
        print("ошибки:", *errors, sep="\n  ")
    return 0


def lst(status="new,verify", top=30):
    q = load_queue()
    want = set(STATUSES) if status == "all" else set(status.split(","))
    items = sorted((c for c in q["items"] if c["status"] in want), key=lambda c: (-len({r.get("pub") or r["name"] for r in c["refs"]}), -c["score"]))
    for c in items[:top]:
        print(f"{c['id']}  [{c['status']}] {c['score']:>5}  {len({r.get('pub') or r['name'] for r in c['refs']})} ист.  {c['first'][:10]}  {c['title'][:90]}")
    print(f"всего в очереди: {len(q['items'])}, показано {min(top, len(items))}")


def set_status(cid, status, note=""):
    if status not in STATUSES:
        sys.exit(f"статус: {', '.join(STATUSES)}")
    q = load_queue()
    c = next((x for x in q["items"] if x["id"] == cid), None) or sys.exit(f"нет {cid}")
    c["status"], c["note"] = status, note or c.get("note", "")
    save_queue(q)
    print(cid, "→", status)


def promote(cid, folder=None):
    """Черновик пасхалки-инструкции для проверки (формат ТЗ агентам 26.11): ссылки-источники уже вписаны, остальное — проверяющему."""
    q = load_queue()
    c = next((x for x in q["items"] if x["id"] == cid), None) or sys.exit(f"нет {cid}")
    folder = pathlib.Path(folder) if folder else CONTENT / f"контент {dt.date.today():%d.%m} — находки сообщества"
    folder.mkdir(parents=True, exist_ok=True)
    slug = "-".join(c["topic"][:4]) or cid
    draft = {"id": f"egg-{slug}", "title": c["title"], "title_ru": "", "description": "", "description_ru": "", "kind": "other",
             "game_name": "", "game_area": "", "real_place": None, "lat": None, "lon": None,
             "how": {"reward": "", "reward_ru": "", "difficulty": "medium", "time_min": 0, "req": [], "steps": [], "fails": [], "missable": False},
             "finder": {"name": c["refs"][0].get("author") or c["refs"][0]["name"], "where": c["refs"][0]["name"], "date": c["first"][:10]},
             "videos": [], "sources": [r["url"] for r in c["refs"]], "confidence": "likely", "verdict": "ЧЕРНОВИК — проверить по ТЗ",
             "found": c["first"][:10], "verified": False, "_candidate": cid}
    f = folder / f"кандидат_{cid}.json"
    f.write_text(json.dumps([draft], ensure_ascii=False, indent=1), "utf-8")
    c["status"], c["draft"] = "card", str(f.relative_to(PROJ))
    save_queue(q)
    print("черновик:", f)


def digest(hours=24):
    q = load_queue()
    since = (now() - dt.timedelta(hours=hours)).strftime("%Y-%m-%dT%H:%M:%SZ")
    fresh = [c for c in q["items"] if c["added"] >= since or any(r["date"] >= since for r in c["refs"])]
    ver = [c for c in fresh if c["status"] == "verify"]
    print(f"## Находки сообщества за {hours} ч — {dt.datetime.now():%d.%m %H:%M}\n")
    print(f"К проверке (≥ 2 источника): {len(ver)}; новых тем: {sum(1 for c in fresh if c['status'] == 'new')}\n")
    for c in sorted(ver, key=lambda c: -c["score"])[:15]:
        names = ", ".join(sorted({r["name"] for r in c["refs"]}))
        print(f"- **{c['title']}** — {names} ({c['id']})")


# ── проверка без сети ──
SAMPLE_RSS = """<?xml version="1.0"?><rss version="2.0"><channel><item><title>GTA 6: how to get the secret Truffade hypercar</title>
<link>https://example.com/a</link><pubDate>Mon, 24 Nov 2026 10:00:00 GMT</pubDate><description>Guide</description></item>
<item><title>GTA 6 sales pass 40 million</title><link>https://example.com/b</link><pubDate>Mon, 24 Nov 2026 11:00:00 GMT</pubDate></item></channel></rss>"""
SAMPLE_ATOM = """<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<entry><title>GTA 6 Secret Truffade Hypercar Location - How To Get It</title><link rel="alternate" href="https://www.youtube.com/watch?v=x1"/>
<published>2026-11-24T12:00:00+00:00</published><media:group><media:community><media:statistics views="120000"/></media:community></media:group></entry></feed>"""
SAMPLE_TG = """<div class="tgme_widget_message" data-post="gtanews/101"><div class="tgme_widget_message_text js-message_text">В GTA 6 нашли секретный гиперкар — как получить</div>
<span class="tgme_widget_message_views">15.2K</span><time datetime="2026-11-24T13:00:00+00:00"></time></div>"""


def selftest():
    global QUEUE
    a = parse_feed(SAMPLE_RSS)
    assert len(a) == 2 and a[0]["date"] == "2026-11-24T10:00:00Z", a
    b = parse_feed(SAMPLE_ATOM)
    assert b[0]["views"] == 120000 and b[0]["url"].endswith("x1"), b
    c = parse_telegram(SAMPLE_TG, "gtanews")
    assert c and c[0]["views"] == 15200 and c[0]["url"] == "https://t.me/gtanews/101", c
    s1 = {"id": "site:x", "name": "Site", "weight": 1, "scope": "general"}
    s2 = {"id": "yt:y", "name": "YT", "weight": 1, "scope": "gta6"}
    assert is_find(s1, a[0]) and not is_find(s1, a[1])
    q = {"items": [], "seen": []}
    r1 = merge(q, s1, a[0])
    r2 = merge(q, s2, b[0])
    assert r1[0] == "new" and r2[0] == "verify" and len(q["items"]) == 1, (r1, r2, q)
    assert merge(q, s1, a[0]) is None   # повтор той же ссылки
    ar = parse_arctic(json.dumps({"data": [{"title": "Found a secret UFO in GTA 6", "permalink": "/r/GTA6/comments/x/y/", "created_utc": 1764000000, "score": 900}]}))
    assert ar and ar[0]["score"] == 900 and is_find({"scope": "gta6"}, ar[0])
    bs = parse_bluesky(json.dumps({"posts": [{"uri": "at://did/app.bsky.feed.post/3k", "author": {"handle": "a.bsky.social"}, "record": {"text": "GTA 6 hidden car"}, "indexedAt": "2026-11-24T10:00:00Z", "likeCount": 3}]}))
    assert bs and bs[0]["url"] == "https://bsky.app/profile/a.bsky.social/post/3k"
    print("test: ок (RSS, Atom+просмотры, Telegram, Reddit через arctic-shift, Bluesky, отбор, склейка двух источников, повтор)")


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd = a[0]
    if cmd == "run":
        only = a[a.index("--only") + 1].split(",") if "--only" in a else None
        sys.exit(run(only, "--dry" in a))
    if cmd == "list":
        lst(a[a.index("--status") + 1] if "--status" in a else "new,verify", int(a[a.index("--top") + 1]) if "--top" in a else 30)
    elif cmd == "set":
        set_status(a[1], a[2], " ".join(a[3:]))
    elif cmd == "promote":
        promote(a[1], a[2] if len(a) > 2 else None)
    elif cmd == "digest":
        digest(int(a[a.index("--hours") + 1]) if "--hours" in a else 24)
    elif cmd == "test":
        selftest()
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
