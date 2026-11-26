"""Ролик «путь по меню» для советов по настройкам: кадры из схем меню (tools/settings_film.html) → mp4 h264 без звука + главы в данные.
settings_video.py <базовый URL репо, напр. http://127.0.0.1:8961/> <игра> <id совета|all> [ru,en] — пишет img/guide/<игра>/<id>-<ps|xb>-<язык>.mp4
и vid.<платформа> {src: '…-{l}.mp4', len, sec, ch{шаг: секунда}} в data/guide/<игра>-settings.json ({l} — язык; длительность кадров
от языка не зависит, главы общие). Кадры — во временной папке (не на SSD)."""
import sys, os, json, subprocess, tempfile, shutil
from playwright.sync_api import sync_playwright
base, game, gid0 = sys.argv[1].rstrip('/') + '/', sys.argv[2], sys.argv[3]
langs = (sys.argv[4] if len(sys.argv) > 4 else 'ru,en').split(',')
repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = shutil.which('ffmpeg') or os.path.expanduser('~/bin/ffmpeg')
dpath = os.path.join(repo, 'data', 'guide', f'{game}-settings.json')
dd = json.load(open(dpath, encoding='utf-8'))
ids = [g['id'] for g in dd['guides']] if gid0 == 'all' else [gid0]
res = {}
for gid in ids:
  for lang in langs:
    out = res.setdefault(gid, {})
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for plat, short in (('playstation', 'ps'), ('xbox', 'xb')):
            pg = b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=1)
            pg.goto(f'{base}tools/settings_film.html?g={game}&id={gid}&p={plat}&lang={lang}')
            pg.wait_for_function('window.READY === true', timeout=15000)
            pg.evaluate('document.fonts.ready')
            frames = pg.evaluate('window.FRAMES')
            tmp = tempfile.mkdtemp(prefix='sbfilm-')
            lst, t, ch = [], 0.0, {}
            for i, f in enumerate(frames):
                pg.evaluate(f'window.show({i})'); pg.wait_for_timeout(60)
                p = os.path.join(tmp, f'{i:03d}.png'); pg.screenshot(path=p)
                if f.get('step'): ch[f['step']] = int(t)
                lst.append(f"file '{p}'\nduration {f['dur']}"); t += f['dur']
            lst.append(f"file '{p}'")
            open(os.path.join(tmp, 'l.txt'), 'w').write('\n'.join(lst) + '\n')
            rel = f'img/guide/{game}/{gid}-{short}-{lang}.mp4'
            subprocess.run([FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'l.txt'), '-vf', 'fps=25,format=yuv420p',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-tune', 'stillimage', '-movflags', '+faststart', '-an', os.path.join(repo, rel)], check=True)
            pg.screenshot(path=os.path.join(tmp, 'x.png'))
            shutil.rmtree(tmp)
            m, s = divmod(round(t), 60)
            out[plat] = {'src': rel, 'len': (f'{m}:{s:02d}'), 'sec': round(t, 1), 'ch': ch}
            print(plat, rel, f'{os.path.getsize(os.path.join(repo, rel)) // 1024} КБ', f'{t:.1f} с', len(frames), 'кадров')
        b.close()
d = json.load(open(dpath, encoding='utf-8'))
for g in d['guides']:
    for plat, v in res.get(g['id'], {}).items():
        v['src'] = v['src'].rsplit('-', 1)[0] + '-{l}.mp4'
        g['how'].setdefault('vid', {})[plat] = v
json.dump(d, open(dpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
