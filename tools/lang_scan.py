#!/usr/bin/env python3
"""Языки не смешиваются (Игорь 21.11.2026): при английском интерфейсе — ни одного русского слова, при русском — ни одной
английской фразы (латиницей остаются названия игр, брендов, мест в игре, кнопки PlayStation/Xbox, коды).

Как проверяет: Playwright (Chrome) обходит экраны в EN и в RU — знакомство, Главная, коды и шторка кода, поиск (и пустой),
Избранное, Настройки и всё, что из них открывается, пейвол, карта и карточки мест GTA 6 и GTA 5, «Для авторов», лента
новостей, страницы s/…, terms/privacy. Наблюдатель (MutationObserver) записывает КАЖДЫЙ показанный текст — и тосты, которые
исчезают через 2 с, — плюс placeholder / aria-label / title.
  EN: утечка — слово кириллицей (кроме имени автора фото в строке авторства).
  RU: утечка — английское служебное слово (the, and, your, open…) — так ловятся непереведённые фразы, а имена собственные
      латиницей (Del Perro Pier, PlayStation) проходят. Исключения — LATIN_OK ниже.
Статика: ключи словарей ru/en в js/i18n.js и js/league.js совпадают; в data/*.json у текста с ru есть en.

Запуск: [LANG_SCAN_CARDS=40] ~/.video-venv/bin/python tools/lang_scan.py <адрес папки приложения> <папка отчёта> [vp]
  адрес — http://127.0.0.1:8941/gta-cheats-demo/ (run_local) или https://sbgta.app/
Итог: <папка>/lang_scan.json {"en": [...], "ru": [...], "static": [...]} и строка «УТЕЧЕК: N». Код выхода 1, если N > 0.
"""
import json, pathlib, re, sys, time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CYR = re.compile(r"[А-Яа-яЁё]{2,}")
EN_STOP = re.compile(r"(?<![\w'’-])(?:the|and|of|to|with|for|your|you|is|are|this|that|from|open|close|back|next|tap|swipe|"
                     r"real life|settings|search|share|loading|error|subscribe|free|days|month|year|places|codes|"
                     r"watch|unlock|try again|not found|in game|copied|done|cancel|continue|sign in|log in)(?![\w'’-])", re.I)
# латиница, которая в русском интерфейсе по смыслу остаётся: имена мест и брендов из игр, лицензии, адреса
LATIN_OK = re.compile(r"Wikimedia Commons|CC BY(?:-SA)?(?: \d\.\d)?|Public domain|gtadb\.org and contributors|"
                      r"Grand Theft Auto[\w ]*|Rockstar Games|Take-Two Interactive|Google Maps|Apple Maps|Street View|"
                      r"App Store|Google Play|PlayStation|Xbox|Steam|TikTok|YouTube Shorts|YouTube|Reels|Instagram|"
                      r"SBgta\.app|sbgta\.app|Secret Base|Pro\b|PRO\b|"
                      r"Bank of Liberty|Bay of \w+|Hall of Fame|Isle of \w+|Port of \w+|Museum of [\w ]+|"
                      r"University of [\w ]+|Church of [\w ]+|Statue of \w+|City of \w+|Pier \d+|"
                      r"\bThe [A-Z][\w'’]*(?: [A-Z][\w'’]*)*", re.U)
# имена собственные со служебными словами (of / and / the / on): реальные места, бренды, игры, художники. Плюс все строки
# tools/names_ru.json, где перевод = оригиналу (имя переводить не нужно), и текст в «ёлочках» (вывеска, цитата, название).
PROPER_EXTRA = ["Ocarina of Time", "Know Your Meme", "Gons and Audet", "Bank of America", "Toyota of Downtown LA",
                "Everglades on the Bay", "Brickell on the River", "Quantum on the Bay", "Zak the Baker", "Jack of Hearts",
                "King of Diamonds", "Adrienne Arsht Center for the Performing Arts", "Hobbs Milford", "Duke of Wellington", "loanDepot park",
                "Thomson Plaza for the Arts", "Back Channel", "TAP"]   # TAP — карта метро Лос-Анджелеса (data-tails 28.11)
def _proper():
    f = ROOT / "tools" / "names_ru.json"
    ru = json.loads(f.read_text("utf-8")) if f.exists() else {}
    names = sorted({k for k, v in ru.items() if k == v} | set(PROPER_EXTRA), key=len, reverse=True)
    # + цепочка слов с заглавной, связанных of / on / the / and / a / is (Walk of Fame, Larios on the Beach, Love Is a Long Road):
    # имя собственное; английская фраза из обычных слов цепочку рвёт («home in the show») и ловится стоп-словами
    chain = r"\b(?!(?:Open|Close|Back|Next|Tap|Swipe|Share|Search|Watch|Unlock|Try|Sign|Log|Get|Go|Save|Start|Continue|Cancel|Done|Show|Hide|Find|Add|Remove|Buy|Subscribe|Restore|Learn|See|View)\b)[A-Z][\w'’.&-]*(?: (?:[A-Z][\w'’.&-]*|of|on|the|and|a|is|in|at|de|del))* [A-Z][\w'’.&-]*"
    return re.compile("|".join(re.escape(n) for n in names) + r"|«[^»]*»|" + chain)
PROPER = _proper()
# строчное английское слово в названии/адресе = пояснение («building», «former», «near»): в русском интерфейсе его надо перевести
_LOW = re.compile(r"(?<![\w'’&.-])[a-z]{3,}(?![\w'’-])")
_LOW_OK = {"del", "des", "von", "van", "der", "les", "los", "las", "dos", "via", "mia", "ave", "blvd"}
def _descr(v):
    t = LATIN_OK.sub("", PROPER.sub("", v))
    return bool(EN_STOP.search(t)) or any(w not in _LOW_OK for w in _LOW.findall(t))
# переключатель языка подписан на своём языке (как у всех сайтов): «Русская версия» в английском режиме — не утечка
EN_OK = re.compile(r"^Русская версия$")
CREDIT = re.compile(r"(?:Фото|Photo|Кадр|Frame)\s*:[^\n]*|[^\n]*\b(?:CC BY|CC0|Public domain|Wikimedia)[^\n]*", re.I)

OBSERVER = r"""
(() => {
  // только ВИДИМЫЙ текст: скрытые блоки (второй язык страницы, display:none) и <head> не считаются; в приложении — с body.ready
  // (до загрузки index.html содержит заготовки, их закрывает экран запуска)
  const seen = window.__seen = new Map(); window.__flow = 'start';
  const app = () => !!document.getElementById('tabbar');
  const live = () => !app() || (document.body && document.body.classList.contains('ready'));
  const vis = (el) => el && !el.closest('head') && (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : el.getClientRects().length > 0);
  const add = (s, how) => { s = (s || '').replace(/\s+/g, ' ').trim(); if (s.length > 1 && !seen.has(s)) seen.set(s, window.__flow + (how ? ' · ' + how : '')); };
  const attrs = (el) => { if (!el.getAttribute || !vis(el)) return; for (const a of ['placeholder', 'aria-label', 'title']) { const v = el.getAttribute(a); if (v) add(v, a); } };
  const walk = (n) => {
    if (!live()) return;
    if (n.nodeType === 3) { const p = n.parentElement; if (p && !/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(p.tagName) && vis(p)) add(n.nodeValue); return; }
    if (n.nodeType !== 1 || /^(HEAD|SCRIPT|STYLE)$/.test(n.tagName) || !vis(n)) return; attrs(n); for (const c of n.childNodes) walk(c);
  };
  let pend = new Set(), t = 0;
  const flush = () => { t = 0; const xs = [...pend]; pend.clear(); xs.forEach((x) => x.isConnected && walk(x)); };
  const q = (n) => { pend.add(n); if (!t) t = setTimeout(flush, 120); };   // после перехода/анимации: текст уже видим
  const go = () => {
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') q(m.target.parentElement || m.target); else if (m.type === 'attributes') q(m.target); else m.addedNodes.forEach(q); } })
      .observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'class', 'hidden', 'style', 'open'] });
    addEventListener('load', () => setTimeout(() => walk(document.body), 300));
    const iv = setInterval(() => { if (app() && live()) { clearInterval(iv); walk(document.body); } }, 200); };
  if (document.documentElement) go(); else document.addEventListener('readystatechange', go, { once: true });
})();
"""


def preset(state):
    return ("(() => { if (sessionStorage.getItem('__t')) return; sessionStorage.setItem('__t', '1'); localStorage.clear();"
            "localStorage.setItem('sb.payapi', 'off'); localStorage.setItem('sb.refapi', 'off');"
            f"const s = {json.dumps(state)}; if (s) localStorage.setItem('cheats.v1', JSON.stringify(s)); }})();")


def run(base, out, vp="iph393"):
    from playwright.sync_api import sync_playwright
    sys.path.insert(0, str(ROOT.parent / "Тестирование 21.10"))
    VPS = {"iph393": dict(viewport={"width": 393, "height": 852}, is_mobile=True, has_touch=True, device_scale_factor=2,
                          user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1")}
    now = int(time.time() * 1000)
    found = {"en": {}, "ru": {}}
    log = []

    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome", headless=True)

        def page(lang, state, locale=None):
            ctx = b.new_context(**VPS[vp], locale=locale or ("ru-RU" if lang == "ru" else "en-US"), service_workers="block",
                                permissions=["clipboard-read", "clipboard-write"])
            ctx.add_init_script("try{Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{}})}catch(e){}")
            ctx.add_init_script(OBSERVER)
            if state is not False:
                ctx.add_init_script(preset(state))
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: log.append(f"pageerror: {str(e)[:160]}"))
            return ctx, pg

        def flow(pg, name):
            try: pg.evaluate(f"window.__flow = {json.dumps(name)}")
            except Exception: pass

        def harvest(pg, lang):
            try:
                for s, where in pg.evaluate("[...window.__seen.entries()]"):
                    found[lang].setdefault(s, where)
            except Exception as e:
                log.append(f"harvest: {str(e)[:120]}")

        def ready(pg, url=None):
            pg.goto(url or base, wait_until="load", timeout=60000)
            try: pg.wait_for_selector("body.ready", timeout=20000)
            except Exception: pass
            pg.wait_for_timeout(700)

        def click(pg, sel, wait=600):
            try:
                loc = pg.locator(sel).first
                if loc.count() == 0 or not loc.is_visible(): return False
                loc.click(timeout=4000); pg.wait_for_timeout(wait); return True
            except Exception:
                return False

        def close_all(pg):
            for _ in range(3):
                if not (click(pg, '#sheet-layer.open [data-action="sheet-close"]', 400) or click(pg, '[data-cr="sheet-close"]:visible', 400)
                        or click(pg, '[data-action="pw-close"]:visible', 400) or click(pg, '[data-cr="close"]:visible', 400)
                        or click(pg, '[data-cr="back"]:visible', 400)):
                    try: pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
                    except Exception: pass
                    break

        def tab(pg, t):
            click(pg, f'#tabbar [data-tab="{t}"]', 800)

        for lang in ("en", "ru"):
            other = "привет" if lang == "en" else "zzqx"
            # 1) знакомство с нуля (язык — из настроек телефона)
            ctx, pg = page(lang, None)
            ready(pg); flow(pg, "онбординг")
            for _ in range(8):
                if not (click(pg, '[data-action="ob-start"]') or click(pg, '[data-action="ob-next"]') or click(pg, '[data-action="plat"]')
                        or click(pg, '[data-action="continue"]')):
                    break
            harvest(pg, lang); ctx.close()

            # 2) пробный доступ: Главная, коды, поиск, Избранное, Настройки, пейвол
            ctx, pg = page(lang, {"onboarded": True, "installHint": True, "g6": 1, "lang": lang, "trialStart": now})
            ready(pg); flow(pg, "Главная")
            pg.mouse.wheel(0, 2500); pg.wait_for_timeout(600); pg.mouse.wheel(0, -2500)
            flow(pg, "новость"); click(pg, '[data-action="open-news"]', 900) or click(pg, '[data-action="news"]', 900) or click(pg, '.news-card', 900); close_all(pg)
            # разделы Главной (23.11.2026): «Все» новости (+ шторка новости), пасхалки, новое на карте
            for v in ("news", "eggs", "newmap"):
                flow(pg, f"раздел {v}")
                if click(pg, f'[data-action="open-feed"][data-v="{v}"]', 900):
                    pg.mouse.wheel(0, 2500); pg.wait_for_timeout(500)
                    if v == "news" and click(pg, '#feed-body [data-action="open-news"]', 900): close_all(pg)
                    click(pg, '#view-feed [data-action="back-home"]', 500)
            flow(pg, "коды"); click(pg, '[data-action="open-cheats"]', 800)
            for i in range(3):
                flow(pg, f"шторка кода {i}")
                try:
                    pg.locator('#view-cheats article.card[data-action="open"]:visible').nth(i * 4).click(timeout=4000); pg.wait_for_timeout(700)
                    click(pg, '#sheet-layer.open [data-action="copy"]', 500); click(pg, '#sheet-layer.open [data-action="fav"]', 500)
                    click(pg, '#sheet-layer.open [data-action="desc"]', 300)
                except Exception: pass
                close_all(pg)
            click(pg, '[data-action="back-home"]')
            flow(pg, "поиск"); tab(pg, "search")
            for q in ("car", "машина", other, "heat"):
                try: pg.fill("#search-input", q); pg.wait_for_timeout(700)
                except Exception: pass
            for ty in ("places", "eggs", "cheats", "all"):
                click(pg, f'[data-action="sf-type"][data-v="{ty}"]', 500)
            flow(pg, "Избранное"); tab(pg, "fav")
            for v in ("cheats", "places", "all"):
                click(pg, f'[data-action="fav-filter"][data-v="{v}"]', 400)
            flow(pg, "Настройки"); tab(pg, "settings")
            for a in ("pick-game", "pick-platform", "howto", "about", "share-app", "rate"):
                flow(pg, f"Настройки · {a}")
                if click(pg, f'.row[data-action="{a}"]', 900):
                    for _ in range(5):
                        if not click(pg, '#sheet-layer.open [data-action="ob-next"], #howto [data-action="ob-next"]', 400): break
                close_all(pg)
            flow(pg, "пейвол"); tab(pg, "home"); click(pg, '[data-action="paywall"]', 1000)
            for th in ('[data-action="plan"]', '[data-action="pw-thing"]', '[data-action="pw-partner"]', '[data-action="buy"]'):
                click(pg, th, 600)
            close_all(pg)
            flow(pg, "карта без Pro"); tab(pg, "map"); pg.wait_for_timeout(2500)
            harvest(pg, lang); ctx.close()

            # 3) Pro: карта и карточки мест GTA 6 и GTA 5, слои
            for g in ("gta6", "gta5"):
                ctx, pg = page(lang, {"onboarded": True, "installHint": True, "g6": 1, "lang": lang, "game": g, "pro": True,
                                      "proPlan": "year", "proUntil": now + 365 * 864e5})
                ready(pg); flow(pg, f"карта {g}"); tab(pg, "map")
                try:
                    pg.wait_for_function("() => window.__gtaMap && window.__gtaMap.loaded", timeout=40000); pg.wait_for_timeout(1500)
                except Exception: log.append(f"{lang} {g}: карта не загрузилась")
                for lay in pg.evaluate("[...document.querySelectorAll('[data-action=\"map-layer\"]')].map(e => e.dataset.v)") or []:
                    click(pg, f'[data-action="map-layer"][data-v="{lay}"]', 400); click(pg, f'[data-action="map-layer"][data-v="{lay}"]', 300)
                ids = pg.evaluate(f"""async () => {{ const r = await fetch(new URL('data/map/{g}.json', document.baseURI)); const d = await r.json();
                    return d.places.map(p => [p.id, p.kind || 'place']); }}""")
                step = max(1, len(ids) // int(__import__("os").environ.get("LANG_SCAN_CARDS", "40")))
                for pid, kind in ids[::step]:
                    flow(pg, f"карточка {g}:{pid}")
                    try:
                        pg.evaluate(f"async () => {{ const m = await import(new URL('js/map.js', document.baseURI).href); return m.focus('{g}', 'place', '{pid}'); }}")
                        pg.wait_for_selector("#sheet-layer.open #sheet-body", timeout=8000); pg.wait_for_timeout(500)
                    except Exception: pass
                close_all(pg)
                harvest(pg, lang); ctx.close()

            # 4) Для авторов (креаторы, рефералка): все кнопки первого уровня
            ctx, pg = page(lang, {"onboarded": True, "installHint": True, "g6": 1, "lang": lang, "trialStart": now})
            ready(pg); tab(pg, "settings"); flow(pg, "Для авторов")
            crs = pg.evaluate("[...document.querySelectorAll('#cr-hub [data-cr]')].map(e => e.dataset.cr)") or []
            for c in dict.fromkeys(crs):
                flow(pg, f"Для авторов · {c}")
                if click(pg, f'#cr-hub [data-cr="{c}"]', 900):
                    for c2 in dict.fromkeys(pg.evaluate("[...document.querySelectorAll('.cr-screen [data-cr], #sheet-layer.open [data-cr]')].map(e => e.dataset.cr)") or []):
                        if c2 in ("back", "close", "sheet-close", "login", "cf-login", "share-link"): continue
                        click(pg, f'.cr-screen [data-cr="{c2}"], #sheet-layer.open [data-cr="{c2}"]', 500)
                    close_all(pg)
                    tab(pg, "settings")
            harvest(pg, lang); ctx.close()

            # 5) страницы вне приложения
            site = re.sub(r"(beta|design|v3|mvp|bounty)/$", "", base)
            pages = ["terms.html", "privacy.html"]
            for g in ("gta6", "gta5"):
                fs = sorted(x.name for x in (ROOT / "s" / g).glob("*.html") if not x.name.startswith("._"))
                pages += [f"s/{g}/{x}" for x in fs[::max(1, len(fs) // 6)][:6]]
            ctx, pg = page(lang, False)
            for u in pages:
                flow(pg, u)
                try: pg.goto(site + u, wait_until="load", timeout=30000); pg.wait_for_timeout(500); flow(pg, u); harvest(pg, lang)
                except Exception as e: log.append(f"{u}: {str(e)[:80]}")
            ctx.close()
        b.close()

    leaks = {"en": [], "ru": []}
    for s, where in found["en"].items():
        t = CREDIT.sub("", s)
        if CYR.search(t) and not EN_OK.match(t.strip()):
            leaks["en"].append({"text": s[:200], "where": where})
    for s, where in found["ru"].items():
        if not CYR.search(s) and len(s) < 4: continue
        t = LATIN_OK.sub("", PROPER.sub("", CREDIT.sub("", s)))
        m = EN_STOP.search(t)
        if m and not re.fullmatch(r"[A-Z0-9 _\-]+", m.group(0)):
            leaks["ru"].append({"text": s[:200], "where": where, "word": m.group(0)})
    leaks["static"] = static_checks()
    leaks["log"] = log
    n = len(leaks["en"]) + len(leaks["ru"]) + len(leaks["static"])
    pathlib.Path(out).mkdir(parents=True, exist_ok=True)
    pathlib.Path(out, "lang_scan.json").write_text(json.dumps(leaks, ensure_ascii=False, indent=1))
    print(f"текстов EN {len(found['en'])}, RU {len(found['ru'])}; УТЕЧЕК: {n} (EN {len(leaks['en'])}, RU {len(leaks['ru'])}, статика {len(leaks['static'])})")
    return n


def dict_keys(src, var):
    """ключи ru и en словаря вида `const T = { ru: {...}, en: {...} }`"""
    out = {}
    for lang in ("ru", "en"):
        m = re.search(r"\n\s*" + lang + r":\s*\{(.*?)\n\s*\},", src[src.index(var):], re.S)
        body = re.sub(r"'(?:[^'\\\n]|\\.)*'|\"(?:[^\"\\\n]|\\.)*\"|`[^`]*`", "''", m.group(1)) if m else ""   # строки — вон
        body = re.sub(r"//[^\n]*", "", body)
        out[lang] = set(re.findall(r"(?:^|[\s,{])([a-z][a-z0-9_]*)\s*:", body, re.M))
    return out


def static_checks():
    bad = []
    for f, var in (("js/i18n.js", "const T"), ("js/league.js", "const T")):
        src = (ROOT / f).read_text("utf-8")
        if var not in src: continue
        k = dict_keys(src, var)
        for x in sorted(k["ru"] - k["en"]): bad.append({"file": f, "issue": f"нет en: {x}"})
        for x in sorted(k["en"] - k["ru"]): bad.append({"file": f, "issue": f"нет ru: {x}"})

    def walk(o, path, f):
        if isinstance(o, dict):
            if "ru" in o and isinstance(o.get("ru"), str) and o["ru"].strip() and not (o.get("en") or "").strip() and CYR.search(o["ru"]):
                bad.append({"file": f, "issue": f"нет en: {path} = {o['ru'][:60]}"})
            for kk, v in o.items(): walk(v, f"{path}.{kk}", f)
        elif isinstance(o, list):
            for i, v in enumerate(o): walk(v, f"{path}[{i}]", f)
    ru_names = json.loads((ROOT / "tools" / "names_ru.json").read_text("utf-8")) if (ROOT / "tools" / "names_ru.json").exists() else {}
    for g in ("gta6", "gta5"):
        d = json.loads((ROOT / "data" / "map" / f"{g}.json").read_text("utf-8"))
        for k in ("places", "eggs"):
            for p in d.get(k) or []:
                for f in ("n", "a", "g", "p"):
                    v = p.get(f)
                    if isinstance(v, str) and v not in ru_names and _descr(v):
                        bad.append({"file": f"data/map/{g}.json", "issue": f"нет русского имени (tools/names_ru.json): {p.get('id')}.{f} = {v[:60]}"})
    for fp in sorted((ROOT / "data").rglob("*.json")):
        if fp.name.startswith("._"): continue
        try: walk(json.loads(fp.read_text("utf-8")), "", str(fp.relative_to(ROOT)))
        except Exception: pass
    return bad


if __name__ == "__main__":
    n = run(sys.argv[1].rstrip("/") + "/", sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "iph393")
    sys.exit(1 if n else 0)
