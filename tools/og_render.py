#!/usr/bin/env python3
"""Картинка превью ссылки 1200×630 «игра | жизнь» (og:image страниц s/<игра>/<id>.html).

Правила — «Ресерч — приложение Secret Base/20 Превью ссылок — как не нарушать права и не портить продукт.md» (15.10.2026):
- фото из жизни CC0 / общественное достояние / CC BY — «ползунок»: половины кадров, линия с кругом (фото можно кадрировать,
  в подписи — «cropped»);
- фото только CC BY-SA — «подборка»: оба снимка целиком, вписаны в свои половины без обрезки, между ними полоса, на фото
  ничего не пишем (иначе это переделка, и share-alike цепляет кадр игры);
- фото нет — кадр игры и вопрос «Where is it in real life?»;
- всегда: подписи «In game» / «Real life» и авторство — на тёмной полосе внизу, не поверх фото, обычным регистром,
  без плашек; маленький логотип на полосе; всё важное — в центральном квадрате 630×630 (миниатюры режут в квадрат);
- рубильник game_frame=False — «только фото из жизни» (вопрос юристу про кадр Rockstar, до 04.11): фото из жизни на
  всю ширину или тёмная карточка с названием.
Пары gtadb (снимки Street View) сюда не попадают никогда — фото из жизни только Commons.
"""
import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, BAND = 1200, 630, 92
TOP = H - BAND
BG, FIELD = (14, 16, 21), (24, 27, 34)
CYAN, WHITE, MUTED = (34, 195, 217), (244, 246, 250), (168, 175, 189)
ICON = pathlib.Path(__file__).resolve().parent.parent / "icons" / "icon-192.png"


def font(size, bold=True):
    return ImageFont.truetype("/System/Library/Fonts/HelveticaNeue.ttc", size, index=1 if bold else 0)


def quality(im):
    """Насколько кадр годится крупно: «полезные» пиксели по ширине (до 1280) × резкость краёв. Растянутая мелкая вырезка
    из трейлера (Игорь 15.10: «ужасные фото, как Вашингтон-Бич») набирает мало: мало пикселей и мягкие края."""
    from PIL import ImageStat
    w = min(im.width, 1280)
    sm = im.convert("L").resize((320, max(1, round(320 * im.height / im.width))), Image.BILINEAR)
    edges = ImageStat.Stat(sm.filter(ImageFilter.FIND_EDGES)).mean[0]
    return w * edges


def licence(cred):
    """'split' — можно кадрировать; 'whole' — только целиком (BY-SA и всё непонятное)."""
    c = (cred or "").upper()
    if "BY-SA" in c or "GFDL" in c:
        return "whole"
    if "CC0" in c or "PUBLIC DOMAIN" in c or "CC BY " in c:
        return "split"
    return "whole"


def _cover(im, w, h):
    k = max(w / im.width, h / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def _fit(im, w, h):
    k = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def _photo_credit(cred, cropped):
    who = (cred or "").replace(" · Wikimedia Commons", "").replace(" · ", ", ").strip(" ,")
    return f"Photo: {who}{', cropped' if cropped else ''}, Wikimedia Commons" if who else ""


def _band(c, left_label=None, right_label=None, center_label=None, credits=()):
    """Нижняя полоса: логотип слева, подписи у центра, строка авторства ниже."""
    d = ImageDraw.Draw(c)
    d.rectangle((0, TOP, W, H), fill=BG)
    try:
        ic = Image.open(ICON).convert("RGBA").resize((30, 30), Image.LANCZOS)
        c.paste(ic, (22, TOP + 14), ic)
    except Exception:
        pass
    d.text((60, TOP + 29), "Secret Base", font=font(20), fill=MUTED, anchor="lm")
    y = TOP + 30
    if left_label:
        d.text((W // 2 - 22, y), left_label, font=font(32), fill=CYAN, anchor="rm")
    if right_label:
        d.text((W // 2 + 22, y), right_label, font=font(32), fill=WHITE, anchor="lm")
    if center_label:
        d.text((W // 2, y), center_label, font=font(32), fill=WHITE, anchor="mm")
    line = "     ".join(x for x in credits if x)
    f = font(17, False)
    while line and d.textlength(line, font=f) > W - 40 and f.size > 12:
        f = font(f.size - 1, False)
    d.text((W // 2, TOP + 70), line, font=f, fill=MUTED, anchor="mm")


def _knob(c, x, y):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rectangle((x - 6, 0, x + 6, TOP), fill=(0, 0, 0, 100))
    gd.ellipse((x - 52, y - 52, x + 52, y + 52), fill=(0, 0, 0, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(9))
    c.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(c)
    d.rectangle((x - 3, 0, x + 3, TOP), fill=(255, 255, 255))
    d.ellipse((x - 42, y - 42, x + 42, y + 42), fill=(255, 255, 255))
    for s in (-1, 1):
        d.line([(x + s * 8, y - 12), (x + s * 19, y), (x + s * 8, y + 12)], fill=(17, 17, 17), width=5, joint="curve")


GAME_CREDIT = "Game frame © Rockstar Games"


def render(g=None, r=None, rcred="", title="", sub="", game_frame=True):
    """g, r — PIL-картинки (или None). Возвращает (картинка, вариант)."""
    c = Image.new("RGB", (W, H), BG)
    if not game_frame:
        g = None
    if g is not None and r is not None:
        if licence(rcred) == "split":
            c.paste(_cover(g, W, TOP).crop((0, 0, W // 2, TOP)), (0, 0))
            c.paste(_cover(r, W, TOP).crop((W // 2, 0, W, TOP)), (W // 2, 0))
            _knob(c, W // 2, TOP // 2)
            _band(c, "In game", "Real life", credits=(GAME_CREDIT, _photo_credit(rcred, True)))
            return c, "split"
        # «подборка» (Игорь 15.10: «подшаманить, чтобы красивее»): фото из жизни целиком (без обрезки, размытия и надписей),
        # на всю высоту, если влезает; кадр игры (не BY-SA) кадрируем под остальную ширину — пустых полей нет.
        # Слишком широкое фото — до 62 % ширины, под ним и над ним размытый кадр игры (само фото не трогаем).
        gap = 10
        rw = r.width * TOP / r.height
        rmax = W * 0.62
        if rw <= rmax:
            ri = r.resize((round(rw), TOP), Image.LANCZOS)
        else:
            ri = r.resize((round(rmax), round(r.height * rmax / r.width)), Image.LANCZOS)
        gwid = W - ri.width - gap
        c.paste(_cover(g, gwid, TOP), (0, 0))
        side = _cover(g, ri.width, TOP).filter(ImageFilter.GaussianBlur(26))
        c.paste(Image.blend(side, Image.new("RGB", side.size, BG), 0.4), (gwid + gap, 0))
        c.paste(ri, (gwid + gap, (TOP - ri.height) // 2))
        _band(c, "In game", "Real life", credits=(GAME_CREDIT, _photo_credit(rcred, False)))
        return c, "whole"
    if g is not None:
        c.paste(_cover(g, W, TOP), (0, 0))
        _band(c, "In game", "Where is it in real life?", credits=(GAME_CREDIT,))
        return c, "game"
    if r is not None:
        if licence(rcred) == "split":
            c.paste(_cover(r, W, TOP), (0, 0))
        else:
            d = ImageDraw.Draw(c)
            d.rectangle((0, 0, W, TOP), fill=FIELD)
            f = _fit(r, W, TOP)
            c.paste(f, ((W - f.width) // 2, (TOP - f.height) // 2))
        _band(c, center_label="Real life", credits=(_photo_credit(rcred, licence(rcred) == "split"),))
        return c, "real"
    d = ImageDraw.Draw(c)   # ни кадра, ни фото — тёмная карточка с названием (по центру — для квадратной миниатюры)
    tf = font(64)
    t = title or "Secret Base"
    while d.textlength(t, font=tf) > 600 and tf.size > 34:
        tf = font(tf.size - 2)
    words, lines = t.split(), [""]
    for w_ in words:
        cand = (lines[-1] + " " + w_).strip()
        if d.textlength(cand, font=tf) <= 600:
            lines[-1] = cand
        else:
            lines.append(w_)
    lines = lines[:3]
    y = TOP // 2 - (len(lines) - 1) * tf.size * 0.6 - (24 if sub else 0)
    for ln in lines:
        d.text((W // 2, y), ln, font=tf, fill=WHITE, anchor="mm")
        y += tf.size * 1.15
    if sub:
        d.text((W // 2, y + 18), sub, font=font(30, False), fill=MUTED, anchor="mm")
    _band(c, credits=("Compare the game and real life in Secret Base",))
    return c, "card"
