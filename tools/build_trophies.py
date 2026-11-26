#!/usr/bin/env python3
"""Карта «трофей / достижение → миссия или глава» GTA 6 (26.11.2026, «Гид по игре», функция «Прогресс через PlayStation / Xbox»).

Вход — ресёрч сессии guide-walkthrough: «Гид по игре — система (26.11.2026)/Прохождение — ресёрч/web_trophies.json»
(55 трофеев, у каждого ≥ 2 источника на название и описание). Связь с сюжетом задана здесь вручную (STORY, SIDE),
потому что в ресёрче она текстом.
Выход — data/guide/trophies.json. Ссылки на базу миссий — по контракту guide-walkthrough: «m:<id>» (EN-название в kebab),
«c:<n>» — глава целиком. Чтобы не зависеть от точного id, у сюжетного трофея есть и mt — EN-название миссии как в игре:
js/progress.js ищет миссию сначала по id, потом по названию.

Стоп (код 1), если: трофеев не 55; у сюжетного трофея нет миссии или главы; имя на Xbox отличается от PS без пометки.
Запуск: python3 tools/build_trophies.py [путь к web_trophies.json]
"""
import json, re, sys, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'Гид по игре — система (26.11.2026)' / 'Прохождение — ресёрч' / 'web_trophies.json'
OUT = ROOT / 'data' / 'guide' / 'trophies.json'


def kebab(s):
    s = s.lower().replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


# сюжетные трофеи: id трофея → (миссия EN | None, глава). Глава без миссии = «глава пройдена целиком».
STORY = {
    'just-like-paradise': ('Gone Fishing', 1),
    'paradise-lost': (None, 1),
    'trust': ('Breakfast Run', 2),
    'break-the-bank': ('The Cartel Heist', 3),
    'vice-city-baby': (None, 3),
    'family-matters': ("Child's Play", 4),
    'dwnfall': ('Headliners', 4),
    'hi-jacked': ('VCIA Takedown', 4),
    'top-of-the-world-ma': (None, 4),
    'snow-storm': ('Operation Savage Glory', 5),
    'you-gotta-know-when-to-get-off': ('The End of the Road', 5),
}
# «Глава 2 пройдена» — id в ресёрче со звёздочками в названии
CH2_END = lambda t: t['en'].startswith('T**s Ass')

# побочные линии: трофей → человек (id как в контракте p:<id>), чтобы гид мог сказать «линия Энди закрыта»
SIDE = {
    'road-to-rehabilitation': ('andy', 'lucia'), 'this-was-no-boat-accident': ('kenton', None),
    'the-lone-rider': ('billy', None), 'supply-demand': ('randy', None), 'spin-on-this': ('tyrone', 'jason'),
    'baited-my-tackle': ('cal', None), 'fair-game': ('bret', None),
}
KIND = {  # остальное — по описанию
    'vice-got-a-price': 'meta', 'a-long-road': 'meta', 'strangers-freaks': 'side',
}


def kind_of(t):
    if t['id'] in KIND: return KIND[t['id']]
    d = (t.get('desc_en') or '').lower()
    if any(w in d for w in ('rob', 'launder', 'heist', 'armored', 'jewelry', 'vault', 'illegal operation', 'wanted')): return 'crime'
    if any(w in d for w in ('collect', 'card', 'waink', 'meditate', 'explore', 'scan', 'discover')): return 'collect'
    if any(w in d for w in ('race', 'stunt', 'shooting', 'drone', 'arcade', 'activity', 'challenge', 'strength')): return 'activity'
    return 'misc'


def main():
    src = json.loads(SRC.read_text())
    T = src['trophies']
    errs = []
    if len(T) != 55: errs.append(f'трофеев {len(T)}, ждали 55')
    out = []
    for i, t in enumerate(T):
        tid = t['id']
        o = {'k': tid, 'en': t['en'], 'g': t['grade'], 'gs': t.get('gs')}
        if t.get('xbox_en') and t['xbox_en'] != t['en']: o['xb'] = t['xbox_en']
        if t.get('desc_en'): o['d'] = t['desc_en']
        st = STORY.get(tid) or ((None, 2) if CH2_END(t) else None)
        if st:
            mt, ch = st
            o['kind'] = 'story'
            o['ch'] = f'c{ch}'
            if mt: o['m'] = f'm:{kebab(mt)}'; o['mt'] = mt
            else: o['end'] = f'c{ch}'          # глава пройдена целиком → последняя миссия главы по базе
        elif tid in SIDE:
            p, who = SIDE[tid]; o['kind'] = 'side'; o['p'] = f'p:{p}'
            if who: o['who'] = who
        else:
            o['kind'] = kind_of(t)
        if t.get('missable'): o['miss'] = 1
        if t.get('rarity') is not None: o['rar'] = t['rarity']
        o['s'] = len(t.get('src') or [])
        out.append(o)
    story = [o for o in out if o['kind'] == 'story']
    if len(story) != 12: errs.append(f'сюжетных трофеев {len(story)}, ждали 12 (STORY + конец главы 2)')
    for o in story:
        if not (o.get('m') or o.get('end')): errs.append(f"{o['k']}: нет миссии и главы")
    if errs:
        print('СТОП:\n  ' + '\n  '.join(errs)); sys.exit(1)
    doc = {
        'v': 1, 'game': 'gta6', 'upd': datetime.date.today().isoformat(),
        'note': 'Имена трофеев на PS и Xbox совпадают (EN). Сопоставление — по EN-имени (запрос к PSN/Xbox с языком en-US), '
                'pid/xid (номер трофея PSN, id достижения Xbox) заполняются при первом настоящем запросе.',
        'ids': {'psn': None, 'xbox': 2035456122, 'ids_note': 'xbox titleId — каталог Microsoft, продукт 9NL3WWNZLZZN (1 источник, на живом аккаунте не проверено); psn NPWR… — узнать первым запросом getUserTitles'},
        'src': src.get('as_of'),
        't': out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'ok: {OUT.relative_to(ROOT)} — {len(out)} трофеев, сюжетных {len(story)}, побочных линий {sum(o["kind"]=="side" for o in out)}')


def stub():
    """Запасная база миссий для демки, пока нет data/guide/missions.json от guide-walkthrough (тот же контракт: m[].id kebab, ch, n)."""
    src = SRC.parent / 'web_missions.json'
    d = json.loads(src.read_text())
    ch, ms, n = [], [], 0
    for c in d['chapters']:
        cid = f"c{c['n']}"
        ch.append({'id': cid, 'n': c['n'], 't': {'en': c.get('en') or f"Chapter {c['n']}"}})
        for m in c.get('missions', []):
            n += 1
            ms.append({'id': kebab(m['en']), 'ch': cid, 'n': n, 'k': 'main', 't': {'en': m['en']}})
    out = ROOT / 'data' / 'guide' / 'missions.stub.json'
    out.write_text(json.dumps({'v': 0, 'game': 'gta6', 'stub': True, 'ch': ch, 'm': ms}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'ok: {out.relative_to(ROOT)} — {len(ms)} миссий (запасная, до слияния с guide-walkthrough)')


if __name__ == '__main__':
    main()
    stub()
