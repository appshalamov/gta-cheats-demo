"""Превью карты для экрана загрузки (js/map.js phShow): снимок стартового вида без точек и кнопок.

  ~/.video-venv/bin/python tools/map_preview.py [корень репо]

Пишет img/ui/map-ph/{game,life}-{gta6,gta5}.webp (393×852, WebP ~q50). Пересоздать после смены плиток или стиля
«Жизни» (js/mapstyle.js) — иначе превью на долю секунды покажет старые цвета. Нужен интернет (плитки, OpenFreeMap).
"""
import sys, os, io, json, time, subprocess, contextlib, socket
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "img", "ui", "map-ph")
W, H = 393, 852


@contextlib.contextmanager
def serve(root):
    s = socket.socket(); s.bind(("127.0.0.1", 0)); port = s.getsockname()[1]; s.close()
    p = subprocess.Popen([sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "-d", root],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try: yield f"http://127.0.0.1:{port}/"
    finally: p.terminate()


KEEP = """() => { const m = window.__gtaMap; for (const l of m.getStyle().layers) {
  const keep = l.type === 'background' || l.source === 'gtamap' || l.source === 'omt';
  if (!keep) m.setLayoutProperty(l.id, 'visibility', 'none'); } }"""
HIDE_UI = "body * { visibility: hidden !important; } #map, #map * { visibility: visible !important; } #map .maplibregl-control-container, #map .map-ph { display: none !important; }"


def shot(b, base, game, mode):
    ctx = b.new_context(viewport={"width": W, "height": H}, device_scale_factor=1, locale="en-US", service_workers="block")
    st = {"onboarded": True, "installHint": True, "g6": 1, "pro": True, "proPlan": "year", "proUntil": int(time.time() * 1000) + 864e8,
          "game": game, "lang": "en"}
    ctx.add_init_script("localStorage.setItem('cheats.v1', %s); localStorage.setItem('sb.payapi','off'); localStorage.setItem('sb.refapi','off');"
                        "localStorage.setItem('secret.map.mode', %s);" % (json.dumps(json.dumps(st)), json.dumps(mode)))
    pg = ctx.new_page()
    pg.goto(base, wait_until="load"); pg.wait_for_selector("body.ready", timeout=30000)
    pg.evaluate("document.querySelector('#tabbar [data-tab=\"map\"]').click()")
    pg.wait_for_function("() => window.__gtaMap && window.__gtaMap.loaded() && window.__gtaMap.areTilesLoaded()", timeout=90000)
    pg.wait_for_timeout(1500)
    pg.evaluate(KEEP); pg.add_style_tag(content=HIDE_UI)
    pg.wait_for_function("() => window.__gtaMap.areTilesLoaded()", timeout=60000); pg.wait_for_timeout(1200)
    png = pg.locator("#map").screenshot()
    ctx.close()
    im = Image.open(io.BytesIO(png)).convert("RGB")
    if im.size != (W, H): im = im.resize((W, H), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    f = os.path.join(OUT, f"{'game' if mode == 'game' else 'life'}-{game}.webp")
    im.save(f, "WEBP", quality=50, method=6)
    print(f, os.path.getsize(f) // 1024, "КБ")


with serve(ROOT) as base, sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"])
    for game in ("gta6", "gta5"):
        for mode in ("game", "real"):
            shot(b, base, game, mode)
    b.close()
