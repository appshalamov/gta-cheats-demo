#!/usr/bin/env python3
"""Карта вышедшей GTA 6 → плитки на нашем хостинге gta-map-assets + игровые координаты мест (19.11.2026 и позже).

Три пути, по тому, что появится первым (утечки — никогда: набор с «yanis» в имени скрипт не берёт):

  1) image — одна большая картинка карты из вышедшей игры: официальная карта Леониды с сайта Rockstar (бесплатная
     загрузка с 19.11) или карта меню паузы, собранная из своих снимков экрана.
        python3 tools/import_gta6_map.py image карта.png [--set release] [--out ПАПКА] [--k ЕДИНИЦ_НА_ПИКСЕЛЬ]
     Режет на плитки в схеме gtadb (256 px, имя «z,y,x.jpg», зумы 0…maxz) в
     «хостинг-плиток/gta-map-assets/maps/tiles/6/<set>/» и пишет рядом meta.json (рамка картинки в единицах «игры»).
     Свой кадр координат: картинка по центру мира, длинная сторона = 16 384 единицы (как полкарты gtadb).

  2) ctrl — опорные точки «место в жизни ↔ пиксель на этой картинке» (снять 15–30 узнаваемых мест: мосты, пирсы,
     стадион, аэропорт, маяки Кис…), файл [{"name": "...", "real": [lat, lon], "img": [px, py]}, …]:
        python3 tools/import_gta6_map.py ctrl опорные.json [--set release]
     Пишет «Карта локаций GTA — реальный мир/данные/gta6_релиз/landmarks_gta6_release.json» в формате landmarks gtadb —
     build_map.py по нему ставит места на карту игры (coords "own"). Печатает ошибку перекрёстной проверки (leave-one-out).

  3) gtadb — когда gtadb.org перестроит GTA 6 по вышедшей игре (не по утечкам; это должно быть сказано в их FAQ/README):
        python3 tools/import_gta6_map.py gtadb <набор>
     Копирует плитки набора из клона ~/Developer/gtadb.org (git pull заранее) на наш хостинг; координаты — coords "gtadb".

После — tools/gta6_switch.py --map live --tiles <set> --maxz <z> --coords own|gtadb, build_map.py, тесты, выкладка.
"""
import json
import math
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT.parent
# GTA6_HOST / GTA6_LM — только для пробного прогона (папки в scratchpad), в работе не задавать
HOST = pathlib.Path(os.environ.get("GTA6_HOST") or PROJ / "хостинг-плиток" / "gta-map-assets" / "maps" / "tiles" / "6")
LM_OUT = pathlib.Path(os.environ.get("GTA6_LM") or PROJ / "Карта локаций GTA — реальный мир" / "данные" / "gta6_релиз" / "landmarks_gta6_release.json")
GTADB = pathlib.Path.home() / "Developer" / "gtadb.org"
WORLD = 32768  # мир −16384…16384 (js/map.js G2M); плитка gtadb z = 2^(z+2) плиток на сторону


def opt(name, default=None):
    a = sys.argv
    return a[a.index(name) + 1] if name in a and a.index(name) + 1 < len(a) else default


def no_leaks(tset):
    if "yanis" in tset.lower():
        sys.exit("СТОП: набор yanis — фанатская карта по утечкам, не берём (правило 14.10.2026)")


def load_image(path):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    p = pathlib.Path(path)
    if p.suffix.lower() == ".pdf":   # официальная карта может прийти PDF — первая страница в PNG средствами macOS
        tmp = pathlib.Path(tempfile.mkdtemp()) / "map.png"
        subprocess.run(["sips", "-s", "format", "png", str(p), "--out", str(tmp)], check=True, capture_output=True)
        p = tmp
    return Image.open(p).convert("RGB")


def cmd_image():
    from PIL import Image
    src, tset = sys.argv[2], opt("--set", "release")
    no_leaks(tset)
    out = pathlib.Path(opt("--out", str(HOST))) / tset
    im = load_image(src)
    W, H = im.size
    k = float(opt("--k", WORLD / 2 / max(W, H)))            # единиц игры на пиксель картинки
    x0, ytop = -W * k / 2, H * k / 2                         # картинка по центру мира
    zmax = max(0, math.ceil(math.log2(128 / k) - 2 - 1e-9))  # зум, где пиксель плитки ≈ пиксель картинки
    bg = im.getpixel((2, 2))                                 # цвет моря по углу — фон плиток за краем картинки
    if out.exists():
        shutil.rmtree(out)
    total = 0
    for z in range(zmax + 1):
        n = 2 ** (z + 2)
        upp = WORLD / (n * 256)                              # единиц на пиксель плитки
        s = k / upp
        w2, h2 = max(1, round(W * s)), max(1, round(H * s))
        sc = im.resize((w2, h2), Image.LANCZOS)
        ox, oy = (x0 + WORLD / 2) / upp, (WORLD / 2 - ytop) / upp   # левый верх картинки в пикселях мира на этом зуме
        (out / str(z)).mkdir(parents=True, exist_ok=True)
        for ty in range(int(oy // 256), int((oy + h2) // 256) + 1):
            for tx in range(int(ox // 256), int((ox + w2) // 256) + 1):
                tile = Image.new("RGB", (256, 256), bg)
                tile.paste(sc, (round(ox - tx * 256), round(oy - ty * 256)))
                tile.save(out / str(z) / f"{z},{ty},{tx}.jpg", quality=82, optimize=True)
                total += 1
    meta = {"source": str(src), "size": [W, H], "k": k, "x0": x0, "ytop": ytop, "maxz": zmax, "set": tset}
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), "utf-8")
    print(f"плитки: {total} шт., зумы 0…{zmax}, {out}")
    print(f"дальше: ctrl опорные.json --set {tset}, затем gta6_switch.py --map live --tiles {tset} --maxz {zmax} --coords own")


def idw(pts, lat, lon, skip=None):
    def m(a, b):
        dy = (a[0] - b[0]) * 111320
        dx = (a[1] - b[1]) * 111320 * math.cos(math.radians((a[0] + b[0]) / 2))
        return math.hypot(dx, dy)
    near = sorted(((m((lat, lon), p["real"]), p["g"]) for i, p in enumerate(pts) if i != skip), key=lambda t: t[0])[:6]
    ws = [1 / max(d, 50) ** 2 for d, _ in near]
    return (sum(w * g[0] for w, (_, g) in zip(ws, near)) / sum(ws), sum(w * g[1] for w, (_, g) in zip(ws, near)) / sum(ws))


def cmd_ctrl():
    tset = opt("--set", "release")
    no_leaks(tset)
    meta = json.loads((pathlib.Path(opt("--out", str(HOST))) / tset / "meta.json").read_text("utf-8"))
    pts = json.loads(pathlib.Path(sys.argv[2]).read_text("utf-8"))
    if len(pts) < 6:
        sys.exit(f"СТОП: опорных точек {len(pts)} — нужно хотя бы 6 (лучше 15–30 по всей карте)")
    for p in pts:
        px, py = p["img"]
        p["g"] = (meta["x0"] + px * meta["k"], meta["ytop"] - py * meta["k"])
    # перекрёстная проверка: убираем точку и предсказываем её по остальным
    err = sorted(math.hypot(*(a - b for a, b in zip(idw(pts, *p["real"], skip=i), p["g"]))) for i, p in enumerate(pts))
    lm = {f"R{i + 1}": [p["name"], [round(p["g"][0], 1), round(p["g"][1], 1)], None, p.get("addr") or p["name"],
                        list(p["real"]), None, [], f"r{i + 1}"] for i, p in enumerate(pts)}
    LM_OUT.parent.mkdir(parents=True, exist_ok=True)
    LM_OUT.write_text(json.dumps(lm, ensure_ascii=False, indent=1), "utf-8")
    print(f"опорных точек: {len(lm)} → {LM_OUT}")
    print(f"ошибка без точки: медиана {err[len(err) // 2]:.0f}, худшая {err[-1]:.0f} единиц игры")


def cmd_gtadb():
    tset = sys.argv[2]
    no_leaks(tset)
    src = GTADB / "maps" / "tiles" / "6" / tset
    if not src.is_dir():
        sys.exit(f"нет {src} — сначала git -C ~/Developer/gtadb.org pull, набор смотреть в maps/tiles/6/")
    dst = HOST / tset
    shutil.copytree(src, dst, dirs_exist_ok=True, ignore=shutil.ignore_patterns("._*"))
    zs = sorted(int(p.name) for p in dst.iterdir() if p.name.isdigit())
    print(f"скопировано в {dst}, зумы {zs[0]}…{zs[-1]}; дальше gta6_switch.py --map live --tiles {tset} --maxz {zs[-1]} --coords gtadb")


if __name__ == "__main__":
    {"image": cmd_image, "ctrl": cmd_ctrl, "gtadb": cmd_gtadb}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
