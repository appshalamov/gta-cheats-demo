"""База миссий GTA 6 для «Прохождения» (26.11.2026): python3 tools/build_guide.py <папка ресёрча> [--check]
Берёт из «Гид по игре — система (26.11.2026)/Прохождение — ресёрч/»:
  база — миссии.json  — главы, люди, миссии (собрано из ch1_ign/ch2_ign + web_missions + web_ru_names, правится руками)
  база — подсказки.json — подсказки «перед миссией» с шагами (пишется руками по web_before + ch*_ign)
и пишет data/guide/missions.json. Стоп (код 1), если:
  - у миссии/главы/подсказки/шага нет текста RU или EN;
  - ссылка from/until/after/opens ведёт на несуществующую миссию;
  - у подсказки меньше двух независимых источников и нет явной пометки one:true (её экран покажет «один источник»);
  - числа в шагах (деньги, время) различаются между RU и EN;
  - у подсказки нет блока how.st или в шаге нет id; id повторяются.
--check — только проверить, ничего не писать.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src_dir = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else os.path.join(
    os.path.dirname(ROOT), 'Гид по игре — система (26.11.2026)', 'Прохождение — ресёрч')
only_check = '--check' in sys.argv
base = json.load(open(os.path.join(src_dir, 'база — миссии.json'), encoding='utf-8'))
tips = json.load(open(os.path.join(src_dir, 'база — подсказки.json'), encoding='utf-8'))
errs = []
num = lambda x: sorted(re.sub(r'[.,\s\u00a0](?=\d{3}\b)', '', m).rstrip('.,') for m in re.findall(r'\d[\d,.\u00a0 ]*\d|\d', x or ''))


def both(o, where):
    if not isinstance(o, dict) or not (o.get('ru') or '').strip() or not (o.get('en') or '').strip():
        errs.append(f'{where}: нет текста RU или EN')
        return
    a, b = num(o['ru']), num(o['en'])
    if a != b:
        errs.append(f'{where}: числа различаются RU {a} / EN {b}')


ids = set()
for c in base['ch']:
    both(c['t'], f"глава {c['id']}")
for p in base.get('ppl', []):
    both(p['t'], f"человек {p['id']}")
for m in base['m']:
    if m['id'] in ids:
        errs.append(f"миссия {m['id']}: id повторяется")
    ids.add(m['id'])
    both(m['t'], f"миссия {m['id']}.t")
    if m.get('o'):
        both(m['o'], f"миссия {m['id']}.o")
    if m.get('timed'):
        both(m['timed'], f"миссия {m['id']}.timed")
    if m.get('pnr'):
        both(m['pnr'], f"миссия {m['id']}.pnr")
    if m.get('kw') and (not m['kw'].get('ru') or not m['kw'].get('en')):
        errs.append(f"миссия {m['id']}: kw без RU или EN")
    if len(set(m.get('s', []))) < 2 and not m.get('one'):
        errs.append(f"миссия {m['id']}: меньше двух источников ({m.get('s')})")
refs = {f'm:{i}' for i in ids}
for m in base['m']:
    for r in m.get('after', []) + [x for x in m.get('opens', []) if x.startswith('m:')]:
        if r not in refs:
            errs.append(f"миссия {m['id']}: ссылка {r} не найдена")
tids = set()
for t in tips:
    w = f"подсказка {t['id']}"
    if t['id'] in tids:
        errs.append(f'{w}: id повторяется')
    tids.add(t['id'])
    for k in ('t', 'rw'):
        both(t.get(k), f'{w}.{k}')
    if t.get('lose'):
        both(t['lose'], f'{w}.lose')
    for k in ('from', 'until'):
        if t.get(k) and t[k] not in refs:
            errs.append(f'{w}: {k}={t[k]} не найдена')
    srcs = set(t.get('s', []))
    if len(srcs) < 2 and not t.get('one'):
        errs.append(f'{w}: меньше двух источников ({sorted(srcs)})')
    for k in srcs:
        if k not in base['src']:
            errs.append(f'{w}: источник {k} не описан в src')
    if not t.get('next'):
        errs.append(f'{w}: пустое «Дальше» (next)')
    if t.get('st') == 'ok' and len(srcs) < 2:
        errs.append(f'{w}: st=ok при одном источнике')
    st = (t.get('how') or {}).get('st') or []
    if not st:
        errs.append(f'{w}: нет шагов how.st')
    sid = set()
    for i, x in enumerate(st):
        if not x.get('id') or x['id'] in sid:
            errs.append(f'{w}: шаг {i + 1} без id или id повторяется')
        sid.add(x.get('id'))
        both(x.get('t'), f'{w}: шаг {i + 1}.t')
        for k in ('ok', 'tr', 'at'):
            if x.get(k) and isinstance(x[k], dict):
                both(x[k], f'{w}: шаг {i + 1}.{k}')
    for r in (t.get('how') or {}).get('req', []):
        both(r.get('t'), f'{w}: req')

if errs:
    print('СТОП —', len(errs), 'ошибок:')
    print('\n'.join('  ' + e for e in errs))
    sys.exit(1)
out = {'v': base.get('v', 1), 'game': base['game'], 'upd': base['upd'], 'src': base['src'], 'ch': base['ch'], 'ppl': base.get('ppl', []),
       'm': base['m'], 'tips': tips}
print(f"ок: глав {len(base['ch'])}, миссий {len(base['m'])} (основных {sum(m['k'] == 'main' for m in base['m'])}), подсказок {len(tips)}")
if not only_check:
    os.makedirs(os.path.join(ROOT, 'data', 'guide'), exist_ok=True)
    p = os.path.join(ROOT, 'data', 'guide', 'missions.json')
    json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('записано', p, os.path.getsize(p), 'байт')
    # записи для указателя гида (tools/build_guide_index.py, решение Fable раздел 3): подсказки этой функции, ключ walk:<игра>:<id>
    G = base['game']
    items = [{'k': f"walk:{G}:{t['id']}", 'kind': 'tip', 't': t['t'], 'sub': t['rw'], 'm': t.get('until'), 'from': t.get('from'), 'until': t.get('until'),
              **({'dur': True} if t.get('dur') else {}), 'sp': t.get('sp', 0), 'lvl': t['lvl'], 'st': t['st'], 'src_n': len(set(t.get('s', []))),
              'steps_n': len(t['how']['st']), 'fr': t['how'].get('fr', 2), **({'min': t['min']} if t.get('min') else {}), 'next': t['next'],
              'ch': base and next((m['ch'] for m in base['m'] if f"m:{m['id']}" == t.get('until')), None)} for t in tips]
    items = [{k: v for k, v in r.items() if v is not None} for r in items]
    q = os.path.join(ROOT, 'data', 'guide', f'entries-walk-{G}.json')
    json.dump({'items': items}, open(q, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('записано', q, len(items), 'записей для указателя')
