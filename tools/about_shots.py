#!/usr/bin/env python3
"""Снимки экранов приложения для sbgta.app/about/ (ТЗ Fable 05 §3.4, 22.11.2026): П1, П2, Т1, Т2, Н1 на RU и EN.

Снимает живой прод (или другой адрес первым аргументом) в покое: iPhone 393×852, плотность 3, тёмная тема, Pro (без пейвола),
знакомство пройдено. Пишет PNG во вторую папку; в about/img/shots/ кладёт сжатые JPEG только после просмотра глазами.
Запуск: heavy-run -p 2 -- ~/.video-venv/bin/python tools/about_shots.py https://sbgta.app/ <папка>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'https://sbgta.app/'
OUT = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'shots'); OUT.mkdir(parents=True, exist_ok=True)
IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
PRO = {'onboarded': True, 'installHint': True, 'pro': True, 'proPlan': 'year', 'proUntil': int(time.time() * 1000) + 3e10, 'theme': 'dark'}
FAVS = ['place:gta6:gta6-ocean-drive-art-deco', 'place:gta6:gta6-colony-hotel', 'place:gta6:gta6-brickell-key', 'place:gta6:gta6-seven-mile-bridge', 'place:gta6:gta6-lummus-park-beach']   # ключ = placeKey: вид:игра:id


def page(b, state, lang, extra=None):
    ctx = b.new_context(viewport={'width': 393, 'height': 852}, user_agent=IOS, is_mobile=True, has_touch=True,
                        device_scale_factor=3, locale='ru-RU' if lang == 'ru' else 'en-US', service_workers='block', color_scheme='dark')
    init = "if(!sessionStorage.__t){sessionStorage.__t=1;localStorage.clear();localStorage.setItem('cheats.v1', %r);" % json.dumps(dict(PRO, lang=lang, **state))
    for k, v in (extra or {}).items():
        init += "localStorage.setItem(%r, %r);" % (k, v)
    ctx.add_init_script(init + '}')
    return ctx, ctx.new_page()


def open_map(pg):
    pg.wait_for_selector('body.ready'); pg.wait_for_timeout(600)
    pg.locator('#tabbar [data-tab="map"]').click()
    pg.wait_for_function('() => window.__gtaMap && window.__gtaMap.loaded()', timeout=60000); pg.wait_for_timeout(1500)


def focus(pg, game, kind, pid):
    pg.evaluate(f"async () => {{ const m = await import(new URL('js/map.js', document.baseURI).href); await m.focus('{game}', '{kind}', '{pid}'); }}")
    pg.wait_for_selector('#sheet-body .mp-media-box, #sheet-body .mp-names', timeout=30000); pg.wait_for_timeout(2500)


def p1(b, lang):   # карточка пасхалки с парой и источниками
    ctx, pg = page(b, {'game': 'gta6'}, lang, {'secret.map.mode': 'real'})
    pg.goto(BASE); open_map(pg); focus(pg, 'gta6', 'egg', __import__('os').environ.get('EGG', 'egg-rialto-venetian-way'))   # у пасхалки есть пары «игра | жизнь»
    pg.screenshot(path=str(OUT / f'p1-{lang}.png')); ctx.close()


def p2(b, lang):   # карта игры GTA 5, «Коллекции»: части корабля, 12 из 50 отмечены
    ctx, pg = page(b, {'game': 'gta5'}, lang, {'secret.map.mode': 'game', 'secret.gl.on': json.dumps(['ship']), 'secret.gl.hidegot': '0'})
    pg.goto(BASE); pg.wait_for_selector('body.ready')
    ids = pg.evaluate("""async () => { const f = await fetch('data/map/layers/gta5_ent.json').then(r => r.json()).catch(() => null);
      const pts = (f ? f.points : []).filter(p => p[2] === 'ship').slice(0, 12);
      return pts.map(([x, y, k, n, key]) => `${k}-${n || key}-${Math.round(x)}_${Math.round(y)}`); }""")
    pg.evaluate("ids => localStorage.setItem('secret.gl.got', JSON.stringify(ids))", ids)
    pg.reload(); open_map(pg)
    pg.evaluate("async () => { const m = await import(new URL('js/map.js', document.baseURI).href); await m.setMode('game'); await m.setGame('gta5'); }")
    pg.wait_for_timeout(3500)
    btn = pg.locator('[data-mp="gl-panel"]')
    if btn.count(): btn.first.click(); pg.wait_for_timeout(1800)
    pg.evaluate("""() => { const r = [...document.querySelectorAll('#sheet-body .gl-row')].find(e => /\\b12 \\/ 50\\b/.test(e.textContent));
      if (r) r.scrollIntoView({ block: 'center' }); }"""); pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / f'p2-{lang}.png')); print('p2 got', len(ids)); ctx.close()


def t1(b, lang):   # карточка Ocean Drive, прокрученная до доступа, сходства и совета
    ctx, pg = page(b, {'game': 'gta6'}, lang, {'secret.map.mode': 'real'})
    pg.goto(BASE); open_map(pg); focus(pg, 'gta6', 'place', 'gta6-ocean-drive-art-deco')
    pg.evaluate("""() => { const s = document.getElementById('sheet-body'); const b = s.querySelector('.mp-names');
      if (b) b.scrollIntoView({ block: 'start' }); }""")
    pg.wait_for_timeout(900); pg.screenshot(path=str(OUT / f't1-{lang}.png')); ctx.close()


def t2(b, lang):   # «Избранное», фильтр «Места»
    ctx, pg = page(b, {'game': 'gta6', 'favPlaces': FAVS}, lang)
    pg.goto(BASE); pg.wait_for_selector('body.ready'); pg.wait_for_timeout(600)
    pg.locator('#tabbar [data-tab="fav"]').click(); pg.wait_for_timeout(1800)
    f = pg.locator('[data-action="fav-filter"][data-v="places"]')
    if f.count(): f.first.click(); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(OUT / f't2-{lang}.png')); ctx.close()


def sc(b, lang):   # карточка Colony Hotel для схемы «ролик — ссылка — карточка»; в странице берётся только шторка карточки
    ctx, pg = page(b, {'game': 'gta6'}, lang, {'secret.map.mode': 'real'})
    pg.goto(BASE); open_map(pg); focus(pg, 'gta6', 'place', 'gta6-colony-hotel')
    pg.screenshot(path=str(OUT / f'sc-{lang}.png')); ctx.close()


def n1(b, lang):   # Главная с лентой «Новое» в первом экране
    ctx, pg = page(b, {'game': 'gta6'}, lang)
    pg.goto(BASE); pg.wait_for_selector('body.ready'); pg.wait_for_timeout(2500)
    pg.evaluate("""() => { const h = [...document.querySelectorAll('.hub-sec, section, .hub-h, h2')].find(e => /Новое|^New/.test(e.textContent.trim()));
      if (h) { const r = h.getBoundingClientRect(); const sc = document.scrollingElement; const box = h.closest('[class*=scroll], main') ; window.scrollBy(0, r.top - 120); } }""")
    pg.wait_for_timeout(1500); pg.screenshot(path=str(OUT / f'n1-{lang}.png')); ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch()
    for lang in ('ru', 'en'):
        for fn in [f for f in (p1, p2, t1, t2, n1, sc) if len(sys.argv) < 4 or f.__name__ in sys.argv[3].split(',')]:
            try: fn(b, lang); print('ok', fn.__name__, lang)
            except Exception as e: print('FAIL', fn.__name__, lang, str(e)[:300])
    b.close()
