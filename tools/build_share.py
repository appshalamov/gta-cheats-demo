#!/usr/bin/env python3
"""Страницы «поделиться местом»: s/<игра>/<id>.html для каждого места и пасхалки (Игорь 15.10.2026: «отправить другу
ссылку на локацию с предпросмотром; захочет детальнее — открывает приложение»).

- В мессенджерах (Telegram, WhatsApp, iMessage) ссылка разворачивается в карточку: og/twitter-теги с названием,
  описанием и кадром игры.
- На странице — кадр игры, свободное фото из жизни (только Commons, с автором), короткое описание (RU/EN по языку
  телефона) и кнопка «Открыть в Secret Base» → приложение сразу на этом месте (…/?open=<kind>:<game>:<id>).
- Фото из жизни gtadb (часто Street View) в превью не кладём; своих копий не делаем.
- Наружу — только Google Maps (правило «не уводить из приложения»).

Запуск: python3 tools/build_share.py   (после build_map.py; пишет s/ в корне приложения)
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://appshalamov.github.io/gta-cheats-demo/"
OUT = ROOT / "s"
GAMES = {"gta5": ("GTA 5", "Los Santos", "Лос-Сантос"), "gta6": ("GTA 6", "Vice City", "Вайс-Сити")}


def absu(u):
    if not u:
        return ""
    return u if u.startswith("http") else SITE + u.lstrip("./")


def game_img(x):
    for ph in [x.get("pg")] + (x.get("gg") or []) + [p.get("g") for p in x.get("pairs") or []]:
        if ph and (ph.get("file") or ph.get("url")):
            return absu(ph.get("file") or ph.get("url")), ph.get("credit", "")
    return "", ""


def real_img(x):
    for ph in [x.get("pr")] + (x.get("gl") or []):
        if ph and "Wikimedia Commons" in (ph.get("credit") or ""):
            return absu(ph.get("file") or ph.get("url")), ph.get("credit", "")
    return "", ""


def t(o, lang):
    if isinstance(o, dict):
        return o.get(lang) or o.get("en") or o.get("ru") or ""
    return o or ""


def page(game, kind, x):
    gt, city_en, city_ru = GAMES[game]
    if kind == "place":
        name_g, name_r, addr = x.get("g") or "", x.get("n") or "", x.get("a") or ""
        d_ru, d_en = t(x.get("s"), "ru"), t(x.get("s"), "en")
    else:
        name_g, name_r, addr = t(x.get("t"), "en"), (x.get("p") or "").split(",")[0], x.get("p") or ""
        d_ru, d_en = t(x.get("d"), "ru"), t(x.get("d"), "en")
    gimg, gcred = game_img(x)
    rimg, rcred = real_img(x)
    title = f"{name_g} = {name_r}" if name_g and name_r else (name_g or name_r)
    og_title = f"{title} · {gt} in real life · Secret Base"
    og_desc = (d_en or d_ru)[:190]
    key = f"{kind}:{game}:{x['id']}"
    app = f"../../?open={key}"
    maps = f"https://www.google.com/maps/search/?api=1&query={x['lat']},{x['lon']}"
    e = html.escape
    imgs = ""
    if gimg:
        imgs += f'<figure><img src="{e(gimg)}" alt="{e(gt)}"><figcaption>🎮 {e(gt)}</figcaption></figure>'
    if rimg:
        imgs += f'<figure><img src="{e(rimg)}" alt="real life"><figcaption>📍 <span data-ru="В жизни" data-en="Real life">Real life</span></figcaption></figure>'
    credits = " · ".join(c for c in (gcred, rcred) if c)
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(og_title)}</title>
<meta name="description" content="{e(og_desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Secret Base">
<meta property="og:title" content="{e(og_title)}"><meta property="og:description" content="{e(og_desc)}">
<meta property="og:url" content="{SITE}s/{game}/{e(x['id'])}.html">
{f'<meta property="og:image" content="{e(gimg)}">' if gimg else ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(og_title)}">
<meta name="twitter:description" content="{e(og_desc)}">{f'<meta name="twitter:image" content="{e(gimg)}">' if gimg else ''}
<meta name="theme-color" content="#0b0d12"><link rel="icon" href="../../icons/icon-192.png">
<style>
:root{{color-scheme:dark}}*{{box-sizing:border-box}}body{{margin:0;background:#0b0d12;color:#eef1f6;font:16px/1.45 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif}}
main{{max-width:560px;margin:0 auto;padding:20px 16px 40px}}.brand{{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.02em}}
.brand img{{width:34px;height:34px;border-radius:9px}}.tag{{display:inline-block;margin:18px 0 6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:800;
background:linear-gradient(90deg,#ff4fa3,#ffb547);color:#111}}h1{{margin:6px 0 2px;font-size:26px;line-height:1.15}}.real{{color:#a9b2c3;margin:0 0 14px}}
.pics{{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px}}figure{{margin:0;position:relative;border-radius:16px;overflow:hidden;background:#151922;aspect-ratio:4/3}}
figure img{{width:100%;height:100%;object-fit:cover;display:block}}figcaption{{position:absolute;left:8px;top:8px;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.6);font-size:12px;font-weight:700}}
p.d{{margin:14px 0}}.cta{{display:block;margin:18px 0 10px;padding:16px;border-radius:16px;text-align:center;font-weight:800;font-size:17px;color:#0b0d12;text-decoration:none;
background:linear-gradient(90deg,#22c3d9,#7ee0ff)}}.sub{{display:block;text-align:center;color:#7ee0ff;font-weight:700;text-decoration:none;margin:6px 0}}
.cred{{color:#6f7787;font-size:11.5px;margin-top:22px}}
</style></head><body><main>
<div class="brand"><img src="../../icons/icon-192.png" alt=""><span>Secret Base</span></div>
<span class="tag">{e(gt)} · <span data-ru="{e(city_ru)} в реальной жизни" data-en="{e(city_en)} in real life">{e(city_en)} in real life</span></span>
<h1>{e(name_g or name_r)}</h1>
<p class="real">📍 {e(name_r)}{(' · ' + e(addr)) if addr and addr != name_r else ''}</p>
<div class="pics">{imgs}</div>
<p class="d" data-ru="{e(d_ru)}" data-en="{e(d_en)}">{e(d_en or d_ru)}</p>
<a class="cta" href="{e(app)}" data-ru="Открыть в Secret Base — сравнить игру и жизнь" data-en="Open in Secret Base — compare game and real life">Open in Secret Base — compare game and real life</a>
<a class="sub" href="{e(maps)}" data-ru="Как добраться — Google Maps" data-en="Directions — Google Maps">Directions — Google Maps</a>
<p class="cred">{e(credits)}{' · ' if credits else ''}Secret Base — fan app, not affiliated with Rockstar Games.</p>
</main>
<script>(()=>{{const ru=(navigator.language||'').toLowerCase().startsWith('ru')||(navigator.language||'').toLowerCase().startsWith('uk');
document.documentElement.lang=ru?'ru':'en';document.querySelectorAll('[data-ru]').forEach(n=>{{const v=n.dataset[ru?'ru':'en'];if(v)n.textContent=v;}});}})();</script>
</body></html>
"""


def main():
    n, made = 0, set()
    for game in GAMES:
        d = json.loads((ROOT / "data" / "map" / f"{game}.json").read_text("utf-8"))
        items = [("place", p) for p in d["places"]] + [("egg", e) for e in d["eggs"]] + [("egg", e) for p in d["places"] for e in p.get("eggs", [])]
        (OUT / game).mkdir(parents=True, exist_ok=True)
        for kind, x in items:
            if x.get("lat") is None or not x.get("id"):
                continue
            fp = OUT / game / f"{x['id']}.html"
            fp.write_text(page(game, kind, x), "utf-8")
            made.add(fp); n += 1
    # лишние страницы (место убрали) — удалить; служебные ._* macOS на exFAT не трогаем (ломали rmtree)
    for fp in OUT.glob("*/*.html"):
        if fp not in made and not fp.name.startswith("._"):
            fp.unlink(missing_ok=True)
    print(f"страниц «поделиться»: {n}")


if __name__ == "__main__":
    main()
