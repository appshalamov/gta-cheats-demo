#!/usr/bin/env python3
"""Логотип шапки «знак SB + SBgta.app».
19.11.2026 — вместо надписи Secret Base домен, чтобы по скриншоту находили сайт.
21.11.2026 (Игорь): «SB давай большими главными писать, потом gta маленькими, и потом app в том же шрифте» →
«SB» заглавными, «gta» строчными, «.app» тем же шрифтом (Onest). Буквы — контурами (без шрифта в файле), кернинг —
HarfBuzz, как в наборе текста. Варианты A/B/C сравнивались 21.11 («Логотип sbgta.app (19.11.2026)/варианты 21.11»),
выбран CHOICE.

Пишет icons/brand-lockup-dark.svg и icons/brand-lockup-light.svg (их подключает index.html; CSS .hub-brand .lk не меняется)
и печатает ширину — её же поставить в атрибут width у <img class="lk"> в index.html (иначе прыжок при загрузке).
Запуск: ~/.video-venv/bin/python tools/make_lockup_domain.py [--variants <папка>]
"""
import io, pathlib, re, sys
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"
FONT = ROOT / "fonts" / "onest.woff2"
H = 195.0                 # высота файла (как у прежнего lockup — CSS не трогаем)
MARK_H = 166.0            # высота знака
CAP = 112.0               # высота заглавных в единицах файла (строчные Onest — 0,745 от неё)
GAP = 32.0                # знак → надпись
INK = {"dark": "#f4f1ec", "light": "#1c1b20"}
MUTED = {"dark": "#b9b4bf", "light": "#6b6873"}
PINK = {"dark": ("#ffa2b4", "#ff7f98"), "light": ("#ff7f98", "#ff4f74")}
MARK = {"dark": "brand-mark.svg", "light": "brand-mark-light.svg"}

# части надписи: (текст, вес, заливка: ink | muted | pink), трекинг в долях em
VARIANTS = {
    "A": {"title": "SB и gta одним весом, .app розовым",
          "parts": [("SB", 800, "ink"), ("gta", 800, "ink"), (".app", 560, "pink")], "track": -0.01},
    "B": {"title": "SB розовым, как знак; gta и .app — цветом текста",
          "parts": [("SB", 800, "pink"), ("gta", 760, "ink"), (".app", 520, "muted")], "track": -0.01},
    "C": {"title": "Лестница веса: SB 800, gta 640, .app 640 розовым",
          "parts": [("SB", 820, "ink"), ("gta", 640, "ink"), (".app", 640, "pink")], "track": -0.005},
}
CHOICE = "A"

_cache = {}


def fonts(weight):
    """(fontTools-экземпляр нужного веса для контуров, hb.Font того же веса для набора)"""
    if weight not in _cache:
        f = TTFont(FONT); f.flavor = None
        buf = io.BytesIO(); f.save(buf); raw = buf.getvalue()
        ft = instancer.instantiateVariableFont(TTFont(io.BytesIO(raw)), {"wght": weight})
        hf = hb.Font(hb.Face(raw)); hf.set_variations({"wght": weight})
        _cache[weight] = (ft, hf)
    return _cache[weight]


def shape(text, weight):
    """[(имя глифа, x_advance, x_offset)] с кернингом из GPOS"""
    ft, hf = fonts(weight)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(hf, buf, {"kern": True, "liga": False})
    order = ft.getGlyphOrder()
    return [(order[i.codepoint], p.x_advance, p.x_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def mark_inner(name):
    s = (ICONS / name).read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    inner = re.sub(r"^.*?<svg[^>]*>", "", s, flags=re.S).rsplit("</svg>", 1)[0]
    return vb, inner


def build(theme, key=None):
    key = key or CHOICE
    v = VARIANTS[key]
    ft0, _ = fonts(800)
    upm = ft0["head"].unitsPerEm
    scale = CAP / ft0["OS/2"].sCapHeight
    vb, inner = mark_inner(MARK[theme])
    ms = MARK_H / vb[3]
    mw = vb[2] * ms
    my = (H - MARK_H) / 2
    # оптический центр: середина заглавных чуть ниже центра знака (хвост g тянет надпись вниз меньше, чем кажется)
    base = H / 2 + CAP / 2 + 2.0
    x = mw + GAP
    gid = f"g{theme}{key}"
    fills = {"ink": INK[theme], "muted": MUTED[theme], "pink": f"url(#{gid})"}
    track = v["track"] * upm
    groups = []
    for n, (text, w, fill) in enumerate(v["parts"]):
        ft, _ = fonts(w)
        gs = ft.getGlyphSet()
        paths = []
        if n:
            x += track * scale          # стык частей разного веса: HarfBuzz пары не видит — обычный трекинг
        for name, adv, off in shape(text, w):
            pen = SVGPathPen(gs); gs[name].draw(pen)
            d = pen.getCommands()
            if d:
                paths.append(f'<path transform="translate({x + off * scale:.2f},{base:.2f}) scale({scale:.5f},{-scale:.5f})" d="{d}"/>')
            x += (adv + track) * scale
        x -= track * scale
        groups.append(f'<g fill="{fills[fill]}">{"".join(paths)}</g>')
    W = x + 6
    g = PINK[theme]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H:.1f}" width="{round(W)}" height="{round(H)}">'
            f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{base - CAP * 1.1:.1f}" x2="0" y2="{base:.1f}">'
            f'<stop offset="0" stop-color="{g[0]}"/><stop offset="1" stop-color="{g[1]}"/></linearGradient></defs>'
            f'<g transform="translate({-vb[0] * ms:.2f},{my - vb[1] * ms:.2f}) scale({ms:.5f})">{inner}</g>'
            f'{"".join(groups)}</svg>\n'), round(W)


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--variants":
        out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
        for k in VARIANTS:
            for th in INK:
                svg, w = build(th, k)
                (out / f"lockup-{k}-{th}.svg").write_text(svg)
                print(k, th, w)
        sys.exit()
    for th in INK:
        svg, w = build(th)
        (ICONS / f"brand-lockup-{th}.svg").write_text(svg)
        print(th, w, len(svg))
