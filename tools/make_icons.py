#!/usr/bin/env python3
"""Рисует иконки приложения (нужен Pillow): python tools/make_icons.py"""
import pathlib
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = pathlib.Path(__file__).resolve().parent.parent / "icons"
ACC = (34, 195, 217)


def draw(size, maskable=False):
    S = 1024
    im = Image.new("RGB", (S, S), (0, 0, 0))
    # свечение
    glow = Image.new("RGB", (S, S), (0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse((150, 120, 874, 844), fill=(10, 90, 105))
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    im = Image.blend(im, glow, 1.0)
    d = ImageDraw.Draw(im)
    k = 0.78 if maskable else 1.0
    cx, cy = S / 2, S / 2

    def box(x, y, w, h):  # координаты относительно центра с учётом maskable
        return (cx + (x) * k, cy + (y) * k, cx + (x + w) * k, cy + (y + h) * k)

    # четыре кнопки 2×2 в стиле карточки чита
    cell, gap = 250, 44
    x0, y0 = -(cell + gap / 2), -(cell + gap / 2)
    for i, (dx, dy) in enumerate([(0, 0), (1, 0), (0, 1), (1, 1)]):
        b = box(x0 + dx * (cell + gap), y0 + dy * (cell + gap), cell, cell)
        d.rounded_rectangle(b, radius=58 * k, fill=(22, 22, 26), outline=(60, 60, 68), width=int(6 * k))
    lw = int(26 * k)
    # круг
    b = box(x0 + 55, y0 + 55, cell - 110, cell - 110)
    d.ellipse(b, outline=(255, 90, 95), width=lw)
    # крест
    bx = x0 + cell + gap
    p = 70
    d.line([box(bx + p, y0 + p, 0, 0)[:2], box(bx + cell - p, y0 + cell - p, 0, 0)[:2]], fill=(124, 156, 255), width=lw)
    d.line([box(bx + cell - p, y0 + p, 0, 0)[:2], box(bx + p, y0 + cell - p, 0, 0)[:2]], fill=(124, 156, 255), width=lw)
    # треугольник
    by = y0 + cell + gap
    tri = [box(x0 + cell / 2, by + 62, 0, 0)[:2], box(x0 + cell - 52, by + cell - 70, 0, 0)[:2], box(x0 + 52, by + cell - 70, 0, 0)[:2]]
    d.polygon(tri, outline=(61, 220, 151), width=lw)
    # «L1» акцентом — последняя кнопка подсвечена
    b = box(bx, by, cell, cell)
    d.rounded_rectangle(b, radius=58 * k, fill=ACC)
    try:
        f = ImageFont.truetype("/System/Library/Fonts/SFNSRounded.ttf", int(118 * k))
    except OSError:
        f = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", int(118 * k))
    d.text(((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), "L1", font=f, fill=(0, 22, 26), anchor="mm")
    return im.resize((size, size), Image.LANCZOS)


OUT.mkdir(exist_ok=True)
draw(192).save(OUT / "icon-192.png")
draw(512).save(OUT / "icon-512.png")
draw(512, maskable=True).save(OUT / "icon-maskable-512.png")
draw(180).save(OUT / "apple-touch-icon.png")
print("icons ok")
