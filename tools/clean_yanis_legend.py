#!/usr/bin/env python3
"""Убрать впечатанную легенду/титры карты yanis (gtadb «yanis,18») из плиток нашего хостинга (18.11.2026).

Легенда yanis — прямоугольник справа от карты (доли мира x 0.622…0.806, y 0.164…0.774). Закрашиваем его морем:
каждая строка берёт цвет моря левее легенды (x = 0.61) на той же высоте — вертикальный градиент сохраняется.
    ~/.video-venv/bin/python tools/clean_yanis_legend.py <папка набора, напр. …/maps/tiles/6/yanis18>
Повторный запуск безопасен. Плитки только JPEG «z,y,x.jpg», 256 px, 2^(z+2) на сторону.
"""
import pathlib
import sys
from PIL import Image

X0, X1, Y0, Y1, XS = 0.618, 0.810, 0.160, 0.778, 0.608
root = pathlib.Path(sys.argv[1])
done = 0
for zdir in sorted(p for p in root.iterdir() if p.is_dir() and p.name.isdigit()):
    z = int(zdir.name); n = 2 ** (z + 2); W = n * 256
    cache = {}

    def tile(ty, tx):
        if (ty, tx) not in cache:
            f = zdir / f"{z},{ty},{tx}.jpg"
            cache[(ty, tx)] = Image.open(f).convert("RGB") if f.exists() else None
        return cache[(ty, tx)]

    def sea(gy):
        gx = int(XS * W); im = tile(gy // 256, gx // 256)
        return im.getpixel((gx % 256, gy % 256)) if im else (34, 96, 160)

    px0, px1, py0, py1 = int(X0 * W), int(X1 * W), int(Y0 * W), int(Y1 * W)
    for ty in range(py0 // 256, (py1 - 1) // 256 + 1):
        for tx in range(px0 // 256, (px1 - 1) // 256 + 1):
            f = zdir / f"{z},{ty},{tx}.jpg"
            if not f.exists():
                continue
            im = Image.open(f).convert("RGB")
            a, b = max(px0 - tx * 256, 0), min(px1 - tx * 256, 256)
            for yy in range(max(py0 - ty * 256, 0), min(py1 - ty * 256, 256)):
                c = sea(ty * 256 + yy)
                im.paste(c, (a, yy, b, yy + 1))
            im.save(f, quality=88); done += 1
print("плиток перекрашено:", done)
