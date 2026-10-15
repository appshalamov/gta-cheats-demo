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
import re

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


def trim(im):
    """Срезать чёрные поля по краям кадра (у части кадров gtadb полосы слева/сверху — 15.10, пирс Дель-Перро)."""
    g = im.convert("L").point(lambda v: 255 if v > 18 else 0)
    box = g.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    if (x1 - x0) < im.width * 0.5 or (y1 - y0) < im.height * 0.5 or box == (0, 0, im.width, im.height):
        return im
    return im.crop(box)


def _cover(im, w, h):
    k = max(w / im.width, h / im.height)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def _fit(im, w, h):
    k = min(w / im.width, h / im.height)
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def _who(cred):
    """Автор и лицензия из подписи Commons «Автор · Лицензия · Wikimedia Commons» → ('Автор', 'CC BY 2.0')."""
    parts = [" ".join(x.split()) for x in (cred or "").split(" · ")]
    parts = [x for x in parts if x and x != "Wikimedia Commons"]
    lic = next((x for x in parts if re.match(r"(CC|Public domain|GFDL)", x, re.I)), "")
    who = next((x for x in parts if x != lic), "")
    m = re.match(r"No machine-readable author provided\.\s*(.+?) assumed", who)
    if m:
        who = m.group(1)
    if not who or "unknown author" in who.lower() or who.lower().startswith("автор не указан"):
        who = "unknown author"
    who = re.sub(r"^(фото|photo):\s*", "", who, flags=re.I)
    return who, lic


def _photo_credit(cred, cropped):
    """«Photo: Автор (лицензия)»; кадрированное фото CC BY — с пометкой «cropped» (лицензия требует отметить изменения)."""
    if not cred or "gtadb" in cred.lower():
        return "Photo: gtadb.org contributors"
    who, lic = _who(cred)
    tail = ", ".join(x for x in (lic, "cropped" if cropped else "") if x)
    return f"Photo: {who}" + (f" ({tail})" if tail else "")


CREDIT = (196, 201, 211)   # светло-серая строка авторства
LOGO_W = 190               # место под логотип справа; строка авторства его не задевает


def _logo(c, d):
    """Маленький логотип Secret Base справа на полосе: значок со скруглением и название."""
    f = font(18)
    x1 = W - 24
    try:
        ic = Image.open(ICON).convert("RGB").resize((26, 26), Image.LANCZOS)
        m = Image.new("L", (26, 26), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, 25, 25), radius=6, fill=255)
        c.paste(ic, (x1 - 26, TOP + BAND // 2 - 13), m)
        x1 -= 26 + 9
    except Exception:
        pass
    d.text((x1, TOP + BAND // 2), "Secret Base", font=f, fill=MUTED, anchor="rm")


def _credit_line(d, credits):
    """Одна строка авторства 18–20 px по центру; не влезла — укорачиваем автора («Tony Hisgett from Birmingham» → «Tony
    Hisgett», дальше многоточие), шрифт меньше 18 не делаем (Игорь 15.10: подпись нейтральная, но читаемая)."""
    items = [x for x in credits if x]
    if not items:
        return
    room = W - 2 * LOGO_W - 20
    f = font(19, False)

    def line(xs):
        return " · ".join(xs)

    txt = line(items)
    if d.textlength(txt, font=f) > room:
        f = font(18, False)
    if d.textlength(line(items), font=f) > room:
        items = [re.sub(r"Photo: (.+?) from [^(]+ \(", r"Photo: \1 (", x) for x in items]
    while d.textlength(line(items), font=f) > room:
        i = next((k for k, x in enumerate(items) if x.startswith("Photo: ")), None)
        m = re.match(r"Photo: (.+?)( \(.*\))?$", items[i]) if i is not None else None
        if not m or len(m.group(1)) <= 8:
            break
        items[i] = f"Photo: {m.group(1).rstrip('…')[:-2].rstrip()}…{m.group(2) or ''}"
    d.text((W // 2, TOP + 71), line(items), font=f, fill=CREDIT, anchor="mm")


def _band(c, left_label=None, right_label=None, center_label=None, credits=()):
    """Нижняя тёмная полоса под снимками (не поверх фото): подписи «In game» / «Real life» у центра, под ними одна строка
    авторства, логотип справа. Подписи и строка — в центральном квадрате 630×630 (миниатюры режут в квадрат)."""
    d = ImageDraw.Draw(c)
    d.rectangle((0, TOP, W, H), fill=BG)
    _logo(c, d)
    y = TOP + 31
    if left_label:
        d.text((W // 2 - 22, y), left_label, font=font(32), fill=CYAN, anchor="rm")
    if right_label:
        d.text((W // 2 + 22, y), right_label, font=font(32), fill=WHITE, anchor="lm")
    if center_label:
        d.text((W // 2, y), center_label, font=font(32), fill=WHITE, anchor="mm")
    _credit_line(d, credits)


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


GAME_CREDIT = "Game © Rockstar Games"


def render_pair(g, r, rcred="", centered=False):
    """Пара с одного ракурса (как ползунок в приложении): оба снимка в ОДИН кадр, слева игра, справа жизнь — «половина
    автобуса из GTA, половина настоящая» (Игорь 15.10.2026: «так намного эффектнее, делай так везде, где возможно;
    сначала красиво, о лицензиях — потом»). Фото из жизни — из базы gtadb (часто снимки Street View)."""
    c = Image.new("RGB", (W, H), BG)
    if centered:   # снимки не с одного ракурса (свои пары, люк LOST): каждый — по центру своей половины
        c.paste(_cover(trim(g), W // 2, TOP), (0, 0))
        c.paste(_cover(trim(r), W - W // 2, TOP), (W // 2, 0))
    else:
        gi, ri = _cover(trim(g), W, TOP), _cover(trim(r), W, TOP)
        c.paste(gi.crop((0, 0, W // 2, TOP)), (0, 0))
        c.paste(ri.crop((W // 2, 0, W, TOP)), (W // 2, 0))
    _knob(c, W // 2, TOP // 2)
    _band(c, "In game", "Real life", credits=(GAME_CREDIT, _photo_credit(rcred, True)))
    return c, "pair"


def render(g=None, r=None, rcred="", title="", sub="", game_frame=True):
    """g, r — PIL-картинки (или None). Возвращает (картинка, вариант)."""
    c = Image.new("RGB", (W, H), BG)
    if not game_frame:
        g = None
    g = trim(g) if g is not None else None
    if g is not None and r is not None:
        if licence(rcred) == "split":
            # каждая половина — свой снимок «обложкой» в свою половину (15.10: «картинка из жизни сильно увеличена» —
            # раньше снимок растягивался на всю ширину превью и от него оставалась четверть)
            c.paste(_cover(g, W // 2, TOP), (0, 0))
            c.paste(_cover(r, W - W // 2, TOP), (W // 2, 0))
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
