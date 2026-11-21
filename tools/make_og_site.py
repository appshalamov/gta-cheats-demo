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
# логотип SBgta.app тем же шрифтом и цветом, что в шапке (Игорь 21.11.2026; tools/make_lockup_domain.py, og_render.lockup)
import sys; sys.path.insert(0, str(ROOT / "tools")); import og_render
b, r = og_render.onest(112, 800), og_render.onest(112, 560)
d.text((470, 300), "SBgta", font=b, fill=(244, 241, 236), anchor="ls")
d.text((470 + d.textlength("SBgta", font=b), 300), ".app", font=r, fill=og_render.PINK, anchor="ls")
d.text((474, 375), "GTA 6 & GTA 5 in real life", font=og_render.onest(44, 500), fill=(170, 178, 192))
d.text((474, 435), "Cheat codes, map, game vs real life", font=og_render.onest(34, 450), fill=(120, 128, 142))
im.save(ROOT / "s/og/site.jpg", quality=86)
