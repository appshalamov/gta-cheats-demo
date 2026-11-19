#!/usr/bin/env python3
"""Логотип шапки «знак SB + sbgta.app» (Игорь 19.11.2026: вместо надписи Secret Base — домен, чтобы по скриншоту находили сайт).
«sbgta» — Onest 800, цвет надписи темы; «.app» — Onest 500, розовый градиент знака. Буквы — контурами (без шрифта в файле).
Пишет icons/brand-lockup-dark.svg и icons/brand-lockup-light.svg (их подключает index.html; CSS .hub-brand .lk не меняется).
Запуск: ~/.video-venv/bin/python tools/make_lockup_domain.py
"""
import io, pathlib, re
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "icons"
H = 195.0                 # высота файла (как у прежнего lockup — CSS не трогаем)
MARK_H = 166.0            # высота знака, как была
XH = 82.0                 # высота строчных (x-height) в единицах файла
GAP = 34.0                # знак → надпись
THEMES = {
    "dark": {"mark": "brand-mark.svg", "ink": "#f4f1ec", "g": ("#ffa2b4", "#ff7f98")},
    "light": {"mark": "brand-mark-light.svg", "ink": "#1c1b20", "g": ("#ff7f98", "#ff5c7c")},
}


def font(weight):
    f = TTFont(ROOT / "fonts" / "onest.woff2"); f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return instancer.instantiateVariableFont(TTFont(buf), {"wght": weight})


def run(f, text, x0, scale, base, track=0.0):
    """контуры строки: (svg-путь, ширина в единицах файла)"""
    gs, cmap = f.getGlyphSet(), f.getBestCmap()
    parts, x = [], 0.0
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs); gs[g].draw(pen)
        d = pen.getCommands()
        if d:
            parts.append(f'<path transform="translate({x0 + x * scale:.2f},{base:.2f}) scale({scale:.5f},{-scale:.5f})" d="{d}"/>')
        x += gs[g].width + track
    return "".join(parts), (x - track) * scale


def xheight(f):
    os2 = f["OS/2"]
    if getattr(os2, "sxHeight", 0):
        return os2.sxHeight
    gs = f.getGlyphSet(); bp = BoundsPen(gs); gs["x"].draw(bp); return bp.bounds[3]


def mark_inner(name):
    s = (ICONS / name).read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', s).group(1).split()]
    inner = re.sub(r"^.*?<svg[^>]*>", "", s, flags=re.S).rsplit("</svg>", 1)[0]
    return vb, inner


def build(theme):
    t = THEMES[theme]
    bold, reg = font(800), font(500)
    upm = bold["head"].unitsPerEm
    scale = XH / xheight(bold)
    vb, inner = mark_inner(t["mark"])
    ms = MARK_H / vb[3]
    mw = vb[2] * ms
    my = (H - MARK_H) / 2
    base = H / 2 + XH / 2                      # строчные — по центру знака
    x0 = mw + GAP
    p1, w1 = run(bold, "sbgta", x0, scale, base, track=-0.012 * upm)
    p2, w2 = run(reg, ".app", x0 + w1 + 0.01 * upm * scale, scale, base, track=0.0)
    W = x0 + w1 + 0.01 * upm * scale + w2 + 6
    gid = f"dg{theme}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.1f} {H:.1f}" width="{round(W)}" height="{round(H)}">'
            f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{base - XH * 1.45:.1f}" x2="0" y2="{base:.1f}">'
            f'<stop offset="0" stop-color="{t["g"][0]}"/><stop offset="1" stop-color="{t["g"][1]}"/></linearGradient></defs>'
            f'<g transform="translate({-vb[0] * ms:.2f},{my - vb[1] * ms:.2f}) scale({ms:.5f})">{inner}</g>'
            f'<g fill="{t["ink"]}">{p1}</g><g fill="url(#{gid})">{p2}</g></svg>\n'), round(W)


if __name__ == "__main__":
    for th in THEMES:
        svg, w = build(th)
        (ICONS / f"brand-lockup-{th}.svg").write_text(svg)
        print(th, w, len(svg))
