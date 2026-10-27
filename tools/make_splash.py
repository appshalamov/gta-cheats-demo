#!/usr/bin/env python3
"""Экраны запуска установленного приложения на iPhone (apple-touch-startup-image).
Без них iOS при открытии с экрана «Домой» показывает пустой тёмный экран (Игорь 28.10.2026: «после установки главный экран
какой-то очень грустный»). Картинка: своя ночная панорама Майами (img/ui/gta6/own — без кадров Rockstar, годится и для
App Store), знак SB, «Secret Base» и строка о приложении. Размеры — по устройствам, ссылки для index.html печатаются.
Запуск: ~/.video-venv/bin/python tools/make_splash.py  (Pillow + fontTools; шрифт Onest из fonts/onest.woff2)
"""
import io, pathlib
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "icons" / "splash"
BG = (28, 27, 32)
# (ширина, высота в пикселях, ширина и высота в точках CSS, плотность)
DEVICES = [
    (1320, 2868, 440, 956, 3), (1206, 2622, 402, 874, 3), (1290, 2796, 430, 932, 3), (1179, 2556, 393, 852, 3),
    (1284, 2778, 428, 926, 3), (1170, 2532, 390, 844, 3), (1080, 2340, 360, 780, 3), (1242, 2688, 414, 896, 3),
    (1125, 2436, 375, 812, 3), (828, 1792, 414, 896, 2), (1242, 2208, 414, 736, 3), (750, 1334, 375, 667, 2),
]


def font(size, weight):
    f = TTFont(ROOT / "fonts" / "onest.woff2"); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    ft = ImageFont.truetype(buf, size)
    try: ft.set_variation_by_axes([weight])
    except Exception: pass
    return ft


def cover(im, w, h):
    k = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def render(w, h, scale):
    photo = Image.open(ROOT / "img/ui/gta6/own/gta6-load-02.webp").convert("RGB")
    c = cover(photo, w, h)
    # затемнение сверху (небо — под знак) и снизу (под строку), середина — огни города
    shade = Image.new("L", (1, h))
    for y in range(h):
        t = y / h
        a = 150 if t < .18 else 150 - (t - .18) / .22 * 150 if t < .40 else 0 if t < .72 else (t - .72) / .28 * 200
        shade.putpixel((0, y), int(max(0, min(255, a))))
    c = Image.composite(Image.new("RGB", (w, h), BG), c, shade.resize((w, h)))
    d = ImageDraw.Draw(c)
    s = scale
    mark = Image.open(ROOT / "icons/icon-1024.png").convert("RGBA")
    m = round(96 * s); mark = mark.resize((m, m), Image.LANCZOS)
    mask = Image.new("L", (m, m), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, m - 1, m - 1), radius=round(22 * s), fill=255)
    top = round(h * 0.13)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((w // 2 - m, top - m // 3, w // 2 + m, top + m + m // 3), fill=(255, 120, 160, 70))
    c.paste(glow.filter(ImageFilter.GaussianBlur(40 * s)), (0, 0), glow.filter(ImageFilter.GaussianBlur(40 * s)))
    c.paste(mark, ((w - m) // 2, top), mask)
    title = font(round(34 * s), 760)
    d.text((w / 2, top + m + 22 * s), "Secret Base", font=title, fill=(250, 248, 252), anchor="mt")
    sub = font(round(16 * s), 520)
    d.text((w / 2, top + m + 66 * s), "Карта мест из игр и чит-коды", font=sub, fill=(222, 218, 230), anchor="mt")
    return c


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    links = []
    for w, h, cw, ch, dpr in DEVICES:
        name = f"splash-{w}x{h}.jpg"
        render(w, h, dpr).save(OUT / name, quality=86, optimize=True, progressive=True)
        links.append(f'  <link rel="apple-touch-startup-image" href="icons/splash/{name}" media="(device-width: {cw}px) and (device-height: {ch}px) and (-webkit-device-pixel-ratio: {dpr}) and (orientation: portrait)">')
    print("\n".join(links))
