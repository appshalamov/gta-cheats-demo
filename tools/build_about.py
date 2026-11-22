#!/usr/bin/env python3
"""Данные для сайта-презентации sbgta.app/about/ (22.11.2026).

Берёт места из самого приложения (data/map/gta6.json, gta5.json) и пишет about/places.json:
  dots — все места для карты (точка, название, город, картинка);
  top  — отобранные места для плашек и ползунка: кадр игры и фото из жизни с той же подписью авторства, что в приложении.
Отбор — вручную по контактному листу пар 22.11.2026 (сильные пары «один в один»). Запуск: python3 tools/build_about.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'about' / 'places.json'

# ползунок «в игре ⇄ в жизни» (свои пары приложения, own=1) — первые шесть идут в большое сравнение
HERO = ['gta6:gta6-ocean-drive-art-deco', 'gta6:gta6-lummus-park-beach', 'gta6:gta6-brickell-key',
        'gta6:gta6-seven-mile-bridge', 'gta5:gta5-vinewood-sign', 'gta5:gta5-galileo-observatory']
TILES = HERO + [
    'gta6:gta6-colony-hotel', 'gta6:gta6-old-bahia-honda-bridge', 'gta6:gta6-cardozo', 'gta6:gta6-breakwater',
    'gta6:gta6-mcalpin-ocean-plaza', 'gta6:gta6-wynwood-walls', 'gta6:gta6-bayside-marketplace-skyviews',
    'gta5:gta5-pleasure-pier', 'gta5:gta5-badger-building', 'gta5:gta5-oriental-theater', 'gta5:gta5-pacific-standard-bank',
    'gta5:gta5-rancho-towers', 'gta5:gta5-gentry-manor-hotel', 'gta5:gta5-korean-pavilion', 'gta5:gta5-los-santos-theatre',
    'gta5:gta5-simmet-alley', 'gta5:gta5-beam-me-up', 'gta5:gta5-davis-mlk-memorial', 'gta5:gta5-san-andreas-avenue-bridge',
    'gta5:gta5-celtica-hotel',
]
NAME = {'gta6:gta6-wynwood-walls': 'Wynwood Walls', 'gta6:gta6-bayside-marketplace-skyviews': 'Bayside Marketplace',
        'gta6:gta6-breakwater': 'Hotel Breakwater'}
CITY = {'gta6:gta6-seven-mile-bridge': 'Marathon'}
REGION = {'gta6': {'ru': 'Флорида', 'en': 'Florida'}, 'gta5': {'ru': 'Калифорния', 'en': 'California'}}


def short(n):
    return re.split(r',| \(', n or '')[0].strip() or n


def city(p, g):
    m = re.search(r',\s*([^,]+?),\s*(FL|CA)\b', p.get('a', ''))
    c = re.sub(r'\s*\(.*\)', '', m.group(1)).strip() if m else ''
    return c or None


def local(ph):
    """только свои файлы (img/map/…): чужие адреса gtadb на странице не грузим"""
    if not ph:
        return None
    f = ph.get('file') or ph.get('url') or ''
    if not f.startswith('img/'):
        return None
    c = (ph.get('credit') or '').replace(' · ', ', ').replace('Unknown authorUnknown author or not provided', 'Unknown author')
    return {'f': '../' + f, 't': '../' + (ph.get('thumb') or f), 'c': c}


def tips(p):
    """совет по-русски и по-английски; «английский» текст на кириллице (перевода ещё нет) не берём"""
    t = p.get('tip') or {}
    out = {}
    if t.get('ru'):
        out['ru'] = t['ru']
    if t.get('en') and not re.search(r'[А-Яа-яЁё]{3,}', t['en']):
        out['en'] = t['en']
    return out


def og(g, pid):
    f = sorted((ROOT / 's' / 'og' / g).glob(f'{pid}.*.jpg'))
    return f'../s/og/{g}/{f[-1].name}' if f else ''


def main():
    places = {}
    for g in ('gta6', 'gta5'):
        for p in json.load(open(ROOT / f'data/map/{g}.json'))['places']:
            places[f'{g}:{p["id"]}'] = (g, p)
    dots = []
    for k, (g, p) in places.items():
        img = local(p.get('pr')) or local(p.get('pg'))
        nr = short(p.get('nr')) if p.get('nr') else short(p['n'])
        dots.append([k, round(p['lat'], 5), round(p['lon'], 5), short(p['n']), nr, city(p, g) or '', img['t'] if img else ''])
    top = []
    for k in TILES:
        g, p = places[k]
        own = next((x for x in p.get('pairs', []) if x.get('own')), None)
        gm, rl = local(p.get('pg')), local(p.get('pr'))
        assert gm and rl, f'нет своей пары: {k}'
        if k in HERO:
            assert own, f'в ползунке только свои пары: {k}'
        en = NAME.get(k) or short(p['n'])
        top.append({'k': k, 'g': g, 'en': en, 'ru': NAME.get(k) or (short(p['nr']) if p.get('nr') else en),
                    'city': CITY.get(k) or city(p, g) or REGION[g]['en'], 'game': gm, 'real': rl, 'hero': k in HERO,
                    'lat': p['lat'], 'lon': p['lon'], 'og': og(g, p['id']),
                    'ac': p.get('ac', ''), 'cf': p.get('cf', ''), 'tip': tips(p)})
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({'dots': dots, 'top': top}, ensure_ascii=False, separators=(',', ':')))
    print(f'about/places.json: {len(dots)} точек, {len(top)} плашек, {OUT.stat().st_size // 1024} КБ')


if __name__ == '__main__':
    main()
