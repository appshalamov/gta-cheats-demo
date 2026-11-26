"""Сборка «база — миссии.json» из ресёрча (26.11.2026): python3 tools/guide_merge.py [папка ресёрча]
Источники: ch1_ign.json, ch2_ign.json (локальная вики IGN, главы 1–2, порядок официального прохождения IGN) +
web_missions.json (GTABase, gta.wiki, Dexerto, PowerPyx…; главы 3–5 и вторые источники к 1–2) + web_trophies.json (трофеи глав).
Правило «≥ 2 источника»: миссия глав 1–2 — IGN + web (если web её знает); глав 3–5 — только строки web с conf 2src.
Подшаги из web, которых нет у IGN (Deposit Cash, Save for the Future, Prepare for Vice City, Send Money to Lorena…), — не миссии, пропускаем.
Русское название: официальных RU-названий не найдено (web_ru_names: 0 подтверждённых) — t.ru = английское, как ключ; цель o.ru — по-русски.
Дальше — tools/build_guide.py (проверка и запись data/guide/missions.json).
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'Гид по игре — система (26.11.2026)', 'Прохождение — ресёрч')
J = lambda n: json.load(open(os.path.join(R, n), encoding='utf-8'))
kebab = lambda s: re.sub(r'[^a-z0-9]+', '-', s.lower().replace("'", '').replace('’', '')).strip('-')
norm = lambda s: kebab(s).replace('-', '')
web = J('web_missions.json')
tro = {x['id']: x for x in J('web_trophies.json')['trophies']}

SRC = {
    'ign': {'n': 'IGN', 'u': 'https://www.ign.com/wikis/gta-6/Walkthrough'},
    'gtabase': {'n': 'GTABase', 'u': 'https://www.gtabase.com/gta-6/missions/'},
    'gtawiki': {'n': 'GTA Wiki', 'u': 'https://gta.wiki/w/Missions_in_GTA_VI'},
    'dexerto': {'n': 'Dexerto', 'u': 'https://www.dexerto.com/wikis/gta-6/'},
    'powerpyx': {'n': 'PowerPyx', 'u': 'https://www.powerpyx.com/'},
    'vgc': {'n': 'VGC', 'u': 'https://www.videogameschronicle.com/'},
    'ofzen': {'n': 'Of Zen and Computing', 'u': 'https://www.ofzenandcomputing.com/'},
    'beebom': {'n': 'Beebom', 'u': 'https://beebom.com/'},
    'gamesgg': {'n': 'games.gg', 'u': 'https://games.gg/'},
    'technerd': {'n': 'TechNerdiness', 'u': 'https://technerdiness.com/'},
    'redbull': {'n': 'Red Bull', 'u': 'https://www.redbull.com/'},
    'fandomwire': {'n': 'FandomWire', 'u': 'https://fandomwire.com/'},
    'insider': {'n': 'Insider Gaming', 'u': 'https://insider-gaming.com/'},
    'game8': {'n': 'Game8', 'u': 'https://game8.jp/gta6'},
    'bloxodes': {'n': 'Bloxodes', 'u': 'https://bloxodes.com/'},
    'gameswiki': {'n': 'The Games Wiki', 'u': 'https://thegameswiki.com/gta6/'},
}
HOST = {'gtabase.com': 'gtabase', 'gta.wiki': 'gtawiki', 'dexerto.com': 'dexerto', 'powerpyx.com': 'powerpyx', 'videogameschronicle.com': 'vgc',
        'ofzenandcomputing.com': 'ofzen', 'beebom.com': 'beebom', 'games.gg': 'gamesgg', 'technerdiness.com': 'technerd', 'redbull.com': 'redbull',
        'fandomwire.com': 'fandomwire', 'insider-gaming.com': 'insider', 'game8.jp': 'game8', 'ign.com': 'ign', 'bloxodes.com': 'bloxodes', 'thegameswiki.com': 'gameswiki'}


def keys(urls):
    out = []
    for u in urls or []:
        for h, k in HOST.items():
            if h in u and k not in out:
                out.append(k)
    return out


# название главы по-русски: свой перевод (официальных нет); у главы 2 два семейства русских сайтов сходятся на «Потерянный рай»
CH_RU = {1: 'Как в раю', 2: 'Потерянный рай', 3: 'Сиськи, жопа, наркоденьги', 4: 'Вайс-Сити, детка', 5: 'На вершине мира, ма'}
CH_TRO = {1: 'paradise-lost', 2: 'tees-ass-drug-money', 3: 'vice-city-baby', 4: 'top-of-the-world-ma', 5: 'you-gotta-know-when-to-get-off'}
AREA = {1: {'ru': 'Ки-Ленто и острова Леониды', 'en': 'Key Lento and the Leonida Keys'}, 2: {'ru': 'Порт-Геллхорн', 'en': 'Port Gellhorn'},
        3: {'ru': 'Вайс-Сити', 'en': 'Vice City'}, 4: {'ru': 'Вайс-Сити', 'en': 'Vice City'}, 5: {'ru': 'Леонида', 'en': 'Leonida'}}
# место миссии на карте Secret Base (игра ⇄ жизнь) — «Дальше: на карте»
PL = {'coming-home': ('gta6-homestead-ci', 'Hamlet Correctional'), 'day-release': ('gta6-caribbean-club', 'Rusty Anchor'),
      'overnight-charges': ('gta6-economy-inn-lawtey', 'Starlet Motel'), 'just-moved-in': ('gta6-economy-inn-lawtey', 'Starlet Motel'),
      'moses': ('gta6-watkins-auto-parts', 'Moses Auto'), 'daily-driver': ('gta6-watkins-auto-parts', 'Moses Auto'),
      'thrillbillies': ('gta6-redneck-mud-park', 'Thrillbilly Mud Club'), 'afternoon-delight': ('gta6-bambis-dollhouse', 'Delights')}
# названия-спойлеры: даже «следующая миссия» прячет название до тапа
SP2 = {'discharge-time', 'checking-out', 'sunset', 'tie-up-loose-ends', 'starting-from-zero', 'vcia-takedown', 'protective-custody',
       'the-end-of-the-road', 'unfinished-business', 'honest-abe', 'operation-savage-glory', 'child-s-play', 'childs-play', 'family-matters'}
SKIP = {'deposit-cash-into-buckme', 'save-for-the-future', 'prepare-for-vice-city', 'send-money-to-lorena', 'send-more-money-to-lorena', 'heist-planning'}

webch = {c['n']: c for c in web['chapters']}
webidx = {}
for c in web['chapters']:
    for m in c['missions']:
        webidx[norm(m['en'])] = m

chapters, ms = [], []
for n in (1, 2, 3, 4, 5):
    wc = webch.get(n, {})
    t_en = wc.get('en') or {1: 'Just Like Paradise', 2: 'Paradise Lost'}[n]
    tr = tro.get(CH_TRO[n])
    chapters.append({'id': f'c{n}', 'n': n, 't': {'ru': CH_RU[n], 'en': t_en}, 'area': AREA[n], 'tr': [CH_TRO[n]] if tr else [], 'sp': 0 if n <= 2 else 1})
    if n <= 2:
        ign = J(f'ch{n}_ign.json')
        rows = [m for m in ign['missions'] if m['ty'] == 'main']
        rows.sort(key=lambda m: m['n'])
        for m in rows:
            id_ = kebab(m['en'])
            w = webidx.get(norm(m['en'])) or (webch.get(0, {}).get('missions', [{}])[0] if id_ == 'prologue' else None)
            s = ['ign'] + [k for k in keys((w or {}).get('src')) if k != 'ign']
            ms.append({'id': id_, 'ch': f'c{n}', 'n': m['n'], 'k': 'main', 't': {'ru': m['en'], 'en': m['en']},
                       'who': m.get('who') or [], 'o': {'ru': m.get('obj_ru') or '', 'en': m.get('obj_en') or ''},
                       'timed': None, 'sp': 2 if id_ in SP2 else min(int(m.get('spoiler') or 0), 1), 's': s, 'c': len(s)})
            if m.get('timed'):
                ms[-1]['timed'] = {'ru': m.get('timed_ru') or '', 'en': m['timed']}
    else:
        i = 0
        for m in wc.get('missions', []):
            id_ = kebab(m['en'])
            if id_ in SKIP or m.get('conf') != '2src':
                continue
            i += 1
            s = keys(m.get('src'))
            ms.append({'id': id_, 'ch': f'c{n}', 'n': i, 'k': 'main', 't': {'ru': m['en'], 'en': m['en']}, 'who': [w for w in (m.get('who') or '').lower().replace('&', ',').replace(' and ', ',').split(',') if w.strip() in ('jason', 'lucia')] if isinstance(m.get('who'), str) else [],
                       'o': None, 'timed': None, 'sp': 2 if id_ in SP2 else 1, 's': s, 'c': len(s)})
for m in ms:
    if not m['o'] or not m['o']['ru'] or not m['o']['en']:
        m['o'] = None
    if m['id'] in PL:
        m['pl'], m['pln'] = f"place:gta6:{PL[m['id']][0]}", {'ru': PL[m['id']][1], 'en': PL[m['id']][1]}
    for tid, x in tro.items():
        st = x.get('story') or {}
        if st and norm(str(st.get('after_mission', '')).split('(')[0]) == norm(m['t']['en']):
            m.setdefault('tr', []).append(tid)
    if m['timed'] and not m['timed']['ru']:
        m['timed'] = None   # без русского текста не показываем (заполнить в правках вручную)
# правки вручную (тексты, сроки, исправления порядка): «база — правки.json» {id: {поле: значение}}
fx = os.path.join(R, 'база — правки.json')
if os.path.exists(fx):
    for id_, ch in json.load(open(fx, encoding='utf-8')).items():
        for m in ms:
            if m['id'] == id_:
                m.update(ch)
ppl = [{'id': 'jason', 't': {'ru': 'Джейсон', 'en': 'Jason'}}, {'id': 'lucia', 't': {'ru': 'Лусия', 'en': 'Lucia'}}]
# имя героини по-русски — «Лусия» (ru.wikipedia, rockstargame.ru); в текстах агентов бывает «Лючия»
def fixru(o):
    if isinstance(o, dict) and o.get('ru'):
        o['ru'] = o['ru'].replace('Лючи', 'Луси').replace('Люси', 'Луси')
for m in ms:
    fixru(m.get('o')); fixru(m.get('timed'))
out = {'v': 1, 'game': 'gta6', 'upd': '2026-11-26', 'src': SRC, 'ch': chapters, 'ppl': ppl, 'm': ms}
json.dump(out, open(os.path.join(R, 'база — миссии.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('глав', len(chapters), 'миссий', len(ms), {c['id']: sum(m['ch'] == c['id'] for m in ms) for c in chapters},
      'с одним источником:', [m['id'] for m in ms if m['c'] < 2])

# ── подсказки «перед миссией»: из before глав 1–2 (IGN) + ручные правки и добавления («база — подсказки вручную.json»:
# {"add": [подсказки целиком], "set": {id: {поле: значение}}, "drop": [id]}). Источники сверх IGN — из web_before (подтверждения).
title_to_ref = {norm(m['t']['en']): f"m:{m['id']}" for m in ms}
order_ref = [f"m:{m['id']}" for m in ms]
GOAL = {'relationship': 'rel', 'scene': 'scene', 'item': 'item', 'clothes': 'clothes', 'weapon': 'weapon', 'car': 'car', 'money': 'money', 'trophy': 'trophy', 'stat': 'stat'}


def ref(title):
    if not title:
        return None
    return title_to_ref.get(norm(str(title).split('(')[0]))


tips = []
man = os.path.join(R, 'база — подсказки вручную.json')
man = json.load(open(man, encoding='utf-8')) if os.path.exists(man) else {'add': [], 'set': {}, 'drop': []}
for n in (1, 2):
    for b in J(f'ch{n}_ign.json')['before']:
        if b.get('unsure') or b['id'] in man.get('drop', []):
            continue
        f, u = ref(b.get('window_from')), ref(b.get('deadline'))
        chm = [r for r in order_ref if r.startswith('m:') and next(m for m in ms if f"m:{m['id']}" == r)['ch'] == f'c{n}']
        nxt = [r for r in order_ref if next(m for m in ms if f"m:{m['id']}" == r)['ch'] == f'c{n + 1}']
        prev = [r for r in order_ref if next(m for m in ms if f"m:{m['id']}" == r)['ch'] == f'c{n - 1}']
        if not f:   # необязательная миссия главы — с начала главы
            f = prev[-1] if prev else None
        if not u and not b.get('deadline'):   # «в любой момент» — до конца главы
            u = nxt[0] if nxt else None
        dur = bool(f and u and f == u)
        if dur:   # «во время миссии X»: видна, пока X следующая
            i = order_ref.index(u)
            f = order_ref[i - 1] if i else None
        st = []
        for i, x in enumerate(b.get('steps', [])):
            if not (x.get('ru') and x.get('en')):
                continue
            y = {'id': f's{i + 1}', 't': {'ru': x['ru'], 'en': x['en']}}
            if x.get('ok_ru') and x.get('ok_en'):
                y['ok'] = {'ru': x['ok_ru'], 'en': x['ok_en']}
            if x.get('at_en'):
                y['at'] = x['at_en']
            st.append(y)
        t = {'id': b['id'], 'from': f, 'until': u, 'dur': dur or None, 'goal': GOAL.get(b.get('goal'), 'item'),
             't': {'ru': b['ru'], 'en': b['en']}, 'rw': {'ru': b.get('result_ru') or '', 'en': b.get('result_en') or ''},
             'lose': {'ru': b['lose_ru'], 'en': b['lose_en']} if b.get('lose_ru') and b.get('lose_en') else None,
             'miss': bool(b.get('permanent')), 'how': {'st': st}, 's': ['ign'], 'one': True}
        tips.append(t)
for id_, ch in man.get('set', {}).items():
    for t in tips:
        if t['id'] == id_:
            t.update(ch)
            if len(set(t['s'])) >= 2:
                t.pop('one', None)
tips = [t for t in tips if t['id'] not in {a['id'] for a in man.get('add', [])}] + man.get('add', [])
for t in tips:
    fixru(t['t']); fixru(t['rw']); fixru(t.get('lose'))
    for x in t['how']['st']:
        fixru(x['t']); fixru(x.get('ok')); fixru(x.get('tr'))
    for k in [k for k, v in t.items() if v is None]:
        del t[k]
json.dump(tips, open(os.path.join(R, 'база — подсказки.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('подсказок', len(tips), 'с одним источником:', sum(1 for t in tips if t.get('one')))
