#!/usr/bin/env python3
"""Запасное превью ссылки s/og/site.jpg 1200×630 (QA 20.11.2026: 202 страницы s/ без своей картинки уходили в мессенджер
без превью). build_share.py ставит его в og:image, когда своего превью места нет. Запуск: ~/.video-venv/bin/python tools/make_og_site.py"""
import pathlib
from PIL import Image, ImageDraw, ImageFont
ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H = 1200, 630
im = Image.new("RGB", (W, H), (11, 13, 18)); d = ImageDraw.Draw(im)
ic = Image.open(ROOT / "icons/icon-512.png").convert("RGBA").resize((300, 300))
m = Image.new("L", ic.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, 299, 299), 66, fill=255)
im.paste(ic, (110, 165), m)
def f(sz, bold=True):
    try: return ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial%s.ttf" % (" Bold" if bold else ""), sz)
    except Exception: return ImageFont.load_default()
d.text((470, 215), "sbgta", font=f(110), fill=(238, 241, 246))
d.text((470 + d.textlength("sbgta", font=f(110)), 215), ".app", font=f(110, False), fill=(255, 79, 163))
d.text((474, 350), "GTA 6 & GTA 5 in real life", font=f(44, False), fill=(170, 178, 192))
d.text((474, 410), "Cheat codes, map, game vs real life", font=f(34, False), fill=(120, 128, 142))
im.save(ROOT / "s/og/site.jpg", quality=86)
