#!/usr/bin/env python3
"""Страницы «поделиться местом»: s/<игра>/<id>.html для каждого места и пасхалки (Игорь 15.10.2026: «отправить другу
ссылку на локацию с предпросмотром; захочет детальнее — открывает приложение»).

- В мессенджерах (Telegram, WhatsApp, iMessage) ссылка разворачивается в карточку: og/twitter-теги с названием,
  описанием и кадром игры.
- На странице — кадр игры, свободное фото из жизни (только Commons, с автором), короткое описание (RU/EN по языку
  телефона) и кнопка «Открыть в Secret Base» → приложение сразу на этом месте (…/?open=<kind>:<game>:<id>).
- Фото из жизни gtadb (часто Street View) в превью не кладём; своих копий не делаем.
- Наружу — только Google Maps (правило «не уводить из приложения»).

- Превью в мессенджере (Игорь 15.10.2026: «превьюху In game / Real life, ползунок посередине — чтобы понимали суть»):
  своя картинка s/og/<игра>/<id>.<хеш>.jpg 1200×630 — слева кадр игры, справа фото из жизни, белая линия с кругом
  посередине, подписи IN GAME / REAL LIFE. Фото из жизни в превью — только Commons (своих копий фото gtadb не делаем);
  где Commons нет — кадр игры с подписью «сравни с жизнью». Хеш в имени — мессенджеры не держат старое превью.
  Делаются заранее на все места: превью ссылки мессенджер берёт со страницы (og:image), а у статичного хостинга нет
  сервера, чтобы рисовать её в момент отправки. Попытка 15.10 «рисовать в приложении и слать файлом» не годится:
  Telegram отправляет картинку вместо ссылки (текст со ссылкой теряется). Картинки лёгкие (~60–90 КБ), новые
  дорисовываются, готовые не пересчитываются.
  Нужен Pillow: ~/.video-venv/bin/python tools/build_share.py (системный python3 без Pillow превью не трогает).

Запуск: ~/.video-venv/bin/python tools/build_share.py   (после build_map.py; пишет s/ в корне приложения)
"""
import hashlib
import html
import io
import json
import pathlib
import sys
import urllib.request

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


ASSETS = "https://appshalamov.github.io/gta-map-assets/"
ASSETS_LOCAL = ROOT.parent / "хостинг-плиток" / "gta-map-assets"
OGW, OGH = 1200, 630
try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:          # системный python3 без Pillow — превью не трогаем
    Image = None


def _src(u):
    """Картинка по адресу: свой файл приложения, своя копия хостинга кадров или (на крайний случай) скачать."""
    if u.startswith(SITE):
        p = ROOT / u[len(SITE):]
    elif u.startswith(ASSETS):
        p = ASSETS_LOCAL / u[len(ASSETS):]
    else:
        return None                                   # чужие фото (gtadb ,rl.jpg) в превью не берём
    if p.exists():
        return Image.open(p).convert("RGB")
    with urllib.request.urlopen(u, timeout=20) as r:
        return Image.open(io.BytesIO(r.read())).convert("RGB")


def _cover(im, w, h):
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def _font(size, bold=True):
    return ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size, index=1 if bold else 10)


def _label(d, xy, text, fg, bg, anchor_right=False):
    f = _font(34)
    w = d.textlength(text, font=f)
    x, y = xy
    if anchor_right:
        x -= w + 44
    d.rounded_rectangle((x, y, x + w + 44, y + 58), radius=29, fill=bg)
    d.text((x + 22, y + 29), text, font=f, fill=fg, anchor="lm")


def _fit(im, w, h):
    k = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def _credit_line(rcred):
    """Подпись на самой картинке (лицензии CC требуют автора и лицензию): «Photo: автор · лицензия · Commons · Game © Rockstar Games»."""
    who = (rcred or "").replace("Wikimedia Commons", "Commons").strip(" ·")
    return (f"Photo: {who}   ·   " if who else "") + "Game © Rockstar Games   ·   Secret Base"


def og_card(game, pid, gurl, rurl, rcred=""):
    """Превью 1200×630 «игра | жизнь» → относительный путь от s/<игра>/ или ''.

    Лицензии фото из жизни (аналитика 15.10.2026, 19 §7.2): CC BY-SA нельзя обрезать и склеивать с кадром игры
    (это переработка — её пришлось бы выпускать под BY-SA, а кадр Rockstar так не выпустить). Поэтому:
    - CC0 / общественное достояние / CC BY — «ползунок»: половины кадров, линия с кругом;
    - CC BY-SA (и непонятная лицензия) — два снимка целиком рядом, без обрезки и надписей поверх фото (подборка);
    - всегда — строка с автором и лицензией фото и «© Rockstar Games»."""
    if not gurl:
        return ""
    sig = hashlib.sha1(f"v2|{gurl}|{rurl}|{rcred}".encode()).hexdigest()[:8]
    rel = f"og/{game}/{pid}.{sig}.jpg"
    fp = OUT / rel
    OG_MADE.add(fp)
    if fp.exists() or Image is None:
        return rel if fp.exists() else ""
    g = _src(gurl)
    r = _src(rurl) if rurl else None
    if g is None:
        return ""
    lic = (rcred or "").upper()
    split_ok = r is not None and "BY-SA" not in lic and ("CC0" in lic or "PUBLIC DOMAIN" in lic or "CC BY " in lic)
    if r is not None and not split_ok:
        return _og_side_by_side(fp, rel, g, r, rcred)
    canvas = _cover(g, OGW, OGH)
    if r is not None:
        canvas.paste(_cover(r, OGW, OGH).crop((OGW // 2, 0, OGW, OGH)), (OGW // 2, 0))
    # лёгкое затемнение сверху — подписи читаются на любом кадре
    shade = Image.new("L", (1, OGH))
    for yy in range(OGH):
        shade.putpixel((0, yy), max(0, int(110 * (1 - yy / 170)) if yy < 170 else 0))
    canvas.paste(Image.new("RGB", (OGW, OGH), (0, 0, 0)), (0, 0), shade.resize((OGW, OGH)))
    d = ImageDraw.Draw(canvas)
    _label(d, (28, 26), "IN GAME", (11, 13, 18), (34, 195, 217))
    if r is not None:
        _label(d, (OGW - 28, 26), "REAL LIFE", (255, 255, 255), (16, 18, 24), anchor_right=True)
        cx, cy = OGW // 2, OGH // 2
        glow = Image.new("RGBA", (OGW, OGH), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gd.rectangle((cx - 6, 0, cx + 6, OGH), fill=(0, 0, 0, 110))
        gd.ellipse((cx - 58, cy - 58, cx + 58, cy + 58), fill=(0, 0, 0, 120))
        canvas.paste(glow.filter(ImageFilter.GaussianBlur(10)), (0, 0), glow.filter(ImageFilter.GaussianBlur(10)))
        d = ImageDraw.Draw(canvas)
        d.rectangle((cx - 3, 0, cx + 3, OGH), fill=(255, 255, 255))
        d.ellipse((cx - 48, cy - 48, cx + 48, cy + 48), fill=(255, 255, 255))
        for sx in (-1, 1):
            d.line([(cx + sx * 9, cy - 13), (cx + sx * 21, cy), (cx + sx * 9, cy + 13)], fill=(17, 17, 17), width=6, joint="curve")
    else:
        band = Image.new("RGBA", (OGW, 96), (11, 13, 18, 205))
        canvas.paste(band, (0, OGH - 96), band)
        d.text((OGW // 2, OGH - 48), "Compare with real life in Secret Base", font=_font(36), fill=(255, 255, 255), anchor="mm")
    if r is not None:   # строка автора и лицензии — низ, на тёмной полосе
        band = Image.new("RGBA", (OGW, 40), (0, 0, 0, 165))
        canvas.paste(band, (0, OGH - 40), band)
        ImageDraw.Draw(canvas).text((OGW // 2, OGH - 20), _credit_line(rcred), font=_font(19, False), fill=(235, 238, 244), anchor="mm")
    fp.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(fp, "JPEG", quality=70, optimize=True, progressive=True, subsampling=2)
    return rel


def _og_side_by_side(fp, rel, g, r, rcred):
    """Два снимка целиком рядом (для CC BY-SA): подписи над снимками, автор и лицензия — снизу."""
    canvas = Image.new("RGB", (OGW, OGH), (11, 13, 18))
    d = ImageDraw.Draw(canvas)
    gap, top, boxw, boxh = 16, 84, (OGW - 3 * 16) // 2, 470
    for i, (im, lab, col) in enumerate(((g, "In game", (34, 195, 217)), (r, "Real life", (255, 255, 255)))):
        x0 = gap + i * (boxw + gap)
        fit = _fit(im, boxw, boxh)
        canvas.paste(fit, (x0 + (boxw - fit.width) // 2, top + (boxh - fit.height) // 2))
        d.text((x0 + 4, top - 18), lab, font=_font(40), fill=col, anchor="ls")
    d.text((OGW // 2, top + boxh + 44), _credit_line(rcred), font=_font(19, False), fill=(190, 196, 208), anchor="mm")
    fp.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(fp, "JPEG", quality=72, optimize=True, progressive=True, subsampling=2)
    return rel


OG_MADE = set()


def t(o, lang):
    if isinstance(o, dict):
        return o.get(lang) or o.get("en") or o.get("ru") or ""
    return o or ""


def page(game, kind, x):
    gt, city_en, city_ru = GAMES[game]
    fid = x.get("_file") or x["id"]
    if kind in ("place", "db"):
        name_g, name_r, addr = x.get("g") or "", x.get("n") or "", x.get("a") or ""
        d_ru, d_en = t(x.get("s"), "ru"), t(x.get("s"), "en")
    else:
        name_g, name_r, addr = t(x.get("t"), "en"), (x.get("p") or "").split(",")[0], x.get("p") or ""
        d_ru, d_en = t(x.get("d"), "ru"), t(x.get("d"), "en")
    gimg, gcred = game_img(x)
    rimg, rcred = real_img(x)
    # ползунок «В игре ⇄ В жизни» (Игорь 15.10.2026: «чтобы другу сравнивать в браузере — эффект вау при репостах»):
    # пара с одного ракурса, если есть (фото из жизни — ссылкой на gtadb, как в приложении), иначе кадр игры + Commons
    pr0 = (x.get("pairs") or [None])[0]
    cg, cr = (absu(pr0["g"]["url"]), absu(pr0["r"]["url"])) if pr0 else (gimg, rimg)
    ccred = (pr0["g"].get("credit", "") + " · " + pr0["r"].get("credit", "")) if pr0 else ""
    # точки gtadb: своего фото из жизни нет (только gtadb) — превью ссылки = кадр игры с нашего хостинга, без новых файлов
    og = og_card(game, fid, gimg, rimg, rcred) if kind != "db" else ""
    og_abs = f"{SITE}s/{og}" if og else gimg
    title = f"{name_g} = {name_r}" if name_g and name_r else (name_g or name_r)
    og_title = f"{title} · {gt} in real life · Secret Base"
    og_desc = (d_en or d_ru)[:190]
    key = f"{kind}:{game}:{x['id']}"
    app = f"../../?open={key}"
    maps = f"https://www.google.com/maps/search/?api=1&query={x['lat']},{x['lon']}"
    e = html.escape
    imgs = ""
    if cg and cr:
        imgs = (f'<div class="cmp" style="--x:50%" role="slider" aria-label="compare" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">'
                f'<img class="g" src="{e(cg)}" alt="{e(gt)}" draggable="false"><img class="r" src="{e(cr)}" alt="real life" draggable="false">'
                f'<span class="lab lg">🎮 <span data-ru="В игре" data-en="In game">In game</span></span>'
                f'<span class="lab lr">📷 <span data-ru="В жизни" data-en="Real life">Real life</span></span>'
                f'<div class="line"><span class="knob">‹ ›</span></div></div>'
                f'<p class="hint" data-ru="Проведите пальцем: игра ⇄ жизнь" data-en="Swipe: game ⇄ real life">Swipe: game ⇄ real life</p>')
    elif gimg:
        imgs += f'<figure><img src="{e(gimg)}" alt="{e(gt)}"><figcaption>🎮 {e(gt)}</figcaption></figure>'
    if rimg and not (cg and cr):
        imgs += f'<figure><img src="{e(rimg)}" alt="real life"><figcaption>📍 <span data-ru="В жизни" data-en="Real life">Real life</span></figcaption></figure>'
    credits = " · ".join(c for c in ((ccred,) if pr0 else (gcred, rcred)) if c)
    return f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(og_title)}</title>
<meta name="description" content="{e(og_desc)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Secret Base">
<meta property="og:title" content="{e(og_title)}"><meta property="og:description" content="{e(og_desc)}">
<meta property="og:url" content="{SITE}s/{game}/{e(fid)}.html">
{f'<meta property="og:image" content="{e(og_abs)}">' if og_abs else ''}{'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' if og else ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(og_title)}">
<meta name="twitter:description" content="{e(og_desc)}">{f'<meta name="twitter:image" content="{e(og_abs)}">' if og_abs else ''}
<meta name="theme-color" content="#0b0d12"><link rel="icon" href="../../icons/icon-192.png">
<style>
:root{{color-scheme:dark}}*{{box-sizing:border-box}}body{{margin:0;background:#0b0d12;color:#eef1f6;font:16px/1.45 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif}}
main{{max-width:520px;margin:0 auto;padding:max(10px,env(safe-area-inset-top)) 16px 32px}}.brand{{display:flex;align-items:center;gap:8px;font-weight:800;font-size:14px;letter-spacing:.02em}}
.brand img{{width:26px;height:26px;border-radius:7px}}.tag{{margin-left:auto;font-size:12px;font-weight:700;color:#a9b2c3;text-align:right}}
h1{{margin:10px 0 1px;font-size:19px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.real{{color:#a9b2c3;font-size:13px;line-height:1.35;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.pics{{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px}}figure{{margin:0;position:relative;border-radius:16px;overflow:hidden;background:#151922;aspect-ratio:4/3}}
figure img{{width:100%;height:100%;object-fit:cover;display:block}}figcaption{{position:absolute;left:8px;top:8px;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.6);font-size:12px;font-weight:700}}
p.d{{margin:16px 0 8px;font-size:14.5px;color:#cfd5e0}}.cta{{display:block;margin:12px 0 8px;padding:14px;border-radius:14px;text-align:center;font-weight:800;font-size:16px;color:#0b0d12;text-decoration:none;
background:linear-gradient(90deg,#22c3d9,#7ee0ff)}}.sub{{display:block;text-align:center;color:#7ee0ff;font-weight:700;text-decoration:none;margin:6px 0}}
.cred{{color:#6f7787;font-size:11.5px;margin-top:22px}}
.cmp{{position:relative;aspect-ratio:4/3;border-radius:18px;overflow:hidden;background:#151922;touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:ew-resize}}
.cmp img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}.cmp .r{{clip-path:inset(0 0 0 var(--x))}}
.cmp .line{{position:absolute;top:0;bottom:0;left:var(--x);width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 12px rgba(0,0,0,.5)}}
.cmp .knob{{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:#fff;color:#111;display:grid;place-items:center;font-weight:900;font-size:16px;box-shadow:0 4px 18px rgba(0,0,0,.45)}}
.cmp .lab{{position:absolute;top:10px;padding:5px 11px;border-radius:999px;font-size:13px;font-weight:800;background:rgba(0,0,0,.6)}}.cmp .lg{{left:10px;background:#22c3d9;color:#0b0d12}}.cmp .lr{{right:10px}}
.hint{{text-align:center;color:#a9b2c3;font-size:12.5px;margin:6px 0 0}}
@media (max-height:620px){{.cmp,figure{{aspect-ratio:16/10}}}}
</style></head><body><main>
<div class="brand"><img src="../../icons/icon-192.png" alt=""><span>Secret Base</span><span class="tag">{e(gt)} · <span data-ru="{e(city_ru)} в жизни" data-en="{e(city_en)} in real life">{e(city_en)} in real life</span></span></div>
<h1>{e(name_g or name_r)}</h1>
<p class="real">📍 {e(name_r)}{(' · ' + e(addr)) if addr and addr != name_r else ''}</p>
{imgs if 'class="cmp"' in imgs else f'<div class="pics">{imgs}</div>'}
<a class="cta" href="{e(app)}" data-ru="Открыть в Secret Base" data-en="Open in Secret Base">Open in Secret Base</a>
<p class="d" data-ru="{e(d_ru)}" data-en="{e(d_en)}">{e(d_en or d_ru)}</p>
<a class="sub" href="{e(maps)}" data-ru="Как добраться — Google Maps" data-en="Directions — Google Maps">Directions — Google Maps</a>
<p class="cred">{e(credits)}{' · ' if credits else ''}Secret Base — fan app, not affiliated with Rockstar Games.</p>
</main>
<script>(()=>{{const ru=(navigator.language||'').toLowerCase().startsWith('ru')||(navigator.language||'').toLowerCase().startsWith('uk');
document.documentElement.lang=ru?'ru':'en';document.querySelectorAll('[data-ru]').forEach(n=>{{const v=n.dataset[ru?'ru':'en'];if(v)n.textContent=v;}});
const c=document.querySelector('.cmp');if(!c)return;let drag=false,x0=0,y0=0,dir=null,a=0;
const set=(cx)=>{{const b=c.getBoundingClientRect();const v=Math.max(0,Math.min(100,(cx-b.left)/b.width*100));c.style.setProperty('--x',v+'%');c.setAttribute('aria-valuenow',Math.round(v));}};
c.addEventListener('pointerdown',e=>{{clearInterval(a);drag=true;dir=e.pointerType==='touch'?null:'h';x0=e.clientX;y0=e.clientY;if(dir)set(e.clientX);}});
addEventListener('pointermove',e=>{{if(!drag)return;if(!dir){{const dx=Math.abs(e.clientX-x0),dy=Math.abs(e.clientY-y0);if(dx+dy<6)return;dir=dx>=dy*.7?'h':'v';if(dir==='v'){{drag=false;return;}}}}set(e.clientX);}});
addEventListener('pointerup',()=>{{drag=false;}});addEventListener('pointercancel',()=>{{drag=false;}});
c.addEventListener('touchmove',e=>{{if(dir==='h'&&e.cancelable)e.preventDefault();}},{{passive:false}});
// подсказка движением: ползунок сам качнётся, чтобы было понятно, что его можно тянуть
setTimeout(()=>{{if(drag)return;let t=0;a=setInterval(()=>{{t+=1;c.style.setProperty('--x',(50+22*Math.sin(t/6))+'%');if(t>=38){{clearInterval(a);c.style.setProperty('--x','50%');}}}},16);}},700);
}})();</script>
</body></html>
"""


GTADB_RAW = "https://raw.githubusercontent.com/rolux/gtadb.org/main/"


def db_items(game):
    """Точки сообщества gtadb (их ~1300) — тоже можно отправить другу (Игорь 15.10.2026: «поделиться точкой — везде»).
    Кадр игры — наш хостинг, фото из жизни — ссылкой на gtadb (в ползунке страницы; в превью ссылки — только кадр игры:
    своих копий фото gtadb не делаем)."""
    fp = ROOT / "data" / "map" / f"gtadb_{game}.json"
    if not fp.exists():
        return []
    gt = GAMES[game][0]
    v = 6 if game == "gta6" else 5
    out = []
    for q in json.loads(fp.read_text("utf-8"))["points"]:
        pid, name, district, real, lat, lon, typ = q[:7]
        if lat is None or not pid:
            continue
        ig = {"url": f"{ASSETS}map/photos/{v}/{pid},ig.jpg", "credit": "© Rockstar Games · gtadb.org"} if q[7] else None
        rl = {"url": f"{GTADB_RAW}map/photos/{v}/{pid},rl.jpg", "credit": "gtadb.org and contributors (CC BY 4.0)"} if q[8] else None
        rname = real.split(",")[0]
        where = f" ({district})" if district else ""
        out.append({
            "id": pid, "_file": f"db-{pid}", "lat": lat, "lon": lon,
            "g": name or district or pid, "n": rname, "a": real.split(",", 1)[1].strip() if "," in real else "",
            "s": {"ru": f"{name or district}{where} в {gt} — реальное место: {real}. Сравни кадр игры и фото из жизни.",
                  "en": f"{name or district}{where} in {gt} is a real place: {real}. Compare the game shot with real life."},
            "pg": ig, "pairs": [{"g": ig, "r": rl}] if ig and rl else [],
        })
    return out


def main():
    n, made = 0, set()
    for game in GAMES:
        d = json.loads((ROOT / "data" / "map" / f"{game}.json").read_text("utf-8"))
        items = [("place", p) for p in d["places"]] + [("egg", e) for e in d["eggs"]] + [("egg", e) for p in d["places"] for e in p.get("eggs", [])]
        items += [("db", q) for q in db_items(game)]
        (OUT / game).mkdir(parents=True, exist_ok=True)
        for kind, x in items:
            if x.get("lat") is None or not x.get("id"):
                continue
            fp = OUT / game / f"{x.get('_file') or x['id']}.html"
            fp.write_text(page(game, kind, x), "utf-8")
            made.add(fp); n += 1
    # лишние страницы (место убрали) — удалить; служебные ._* macOS на exFAT не трогаем (ломали rmtree)
    for fp in OUT.glob("*/*.html"):
        if fp not in made and not fp.name.startswith("._"):
            fp.unlink(missing_ok=True)
    if Image is not None:
        for fp in (OUT / "og").glob("*/*.jpg"):
            if fp not in OG_MADE and not fp.name.startswith("._"):
                fp.unlink(missing_ok=True)
    print(f"страниц «поделиться»: {n}, превью: {sum(1 for p in OG_MADE if p.exists())}" + ("" if Image else " (нет Pillow — превью не обновлялись)"))


if __name__ == "__main__":
    main()
