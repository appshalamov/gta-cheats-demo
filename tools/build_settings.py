"""Советы по настройкам GTA 6 → data/guide/gta6-settings.json (функция «настройки» «Гида по игре», 26.11.2026).
Ресёрч с источниками: «Гид по игре — система (26.11.2026)/Настройки — ресёрч/» A (меню и кнопки), B (вождение), C (прицел), D (графика), E (геймплей).
Модель меню — одна на игру: вкладки по порядку (A §2), группы — заголовки в списке (A §5), пункты по порядку групп (A §3, порядок строк — по S1).
Путь к пункту, экраны и ролик считаются из модели (js/guide-menu.js) — правьте порядок здесь, не в путях.
Кнопки: btn[платформа][действие]; st 'ok' — подтверждено (A §4: пауза, вкладки, назад); confirm/up/down/left/right — общее правило Rockstar (ASSUMPTION).
Пишет ещё data/guide/entries-settings-gta6.json — записи kind:set для указателя (проверка: python3 tools/build_guide_index.py).
Проверки при сборке: у каждого шага пункт есть в меню, значение есть в вариантах пункта, у шага ≥ 2 источников или пометка hyp, RU и EN на месте."""
import json, os, sys
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'guide', 'gta6-settings.json')

def I(id, l, v, o=None, ty=None, only=None):
    x = {'id': id, 'l': l, 'v': v}
    if o: x['o'] = o
    if ty: x['ty'] = ty
    if only: x['only'] = only
    return x
OO = ['On', 'Off']; S10 = [str(i) for i in range(0, 11)]; S110 = [str(i) for i in range(1, 11)]; S15 = [str(i) for i in range(1, 6)]
MENU = {
    'pause': {'items': ['Map', 'Game', 'Store', 'Help', 'Photo Studio', 'Settings', 'Retry Checkpoint', 'Restart Mission'], 'target': 'Settings'},
    'start': 'scheme',
    'tabs': [
        {'id': 'scheme', 'l': 'Control Scheme', 'sec': [{'id': 'cs', 'l': '', 'it': [
            I('scheme', 'Control Scheme', 'Default', ['Default', 'Classic', 'Left-Handed']), I('preview', 'Preview', '', ty='go'),
            I('touchpad', 'Touch Pad Button', 'Map', ['Map', 'Camera'], only='playstation'), I('viewbtn', 'View Button', 'Map', ['Map', 'Camera'], only='xbox')]}]},
        {'id': 'controller', 'l': 'Controller', 'sec': [
            {'id': 'sens', 'l': 'Aim & Look Sensitivity', 'it': [I('look_h', 'Horizontal Look Sensitivity', '7', [str(i) for i in range(15)]), I('look_v', 'Vertical Look Sensitivity', '7', [str(i) for i in range(15)]),
                I('aim_h', 'Horizontal Aim Sensitivity', '7', [str(i) for i in range(15)]), I('aim_v', 'Vertical Aim Sensitivity', '7', [str(i) for i in range(15)]),
                I('look_acc', 'Look Acceleration', '7', S10), I('aim_acc', 'Aim Acceleration', '7', S10), I('curve', 'Aim Response Curve', 'Standard', ['Standard', 'Linear', 'Precision', 'Aggressive'])]},
            {'id': 'inv', 'l': 'Inverted Controls', 'it': [I('inv_look', 'Look', 'Default', ['Default', 'Vertical', 'Horizontal', 'Both']), I('inv_move', 'Movement', 'Default'), I('inv_map', '3D Map Rotation', 'Default'), I('inv_air', 'Aircraft Movement', 'Default')]},
            {'id': 'feat', 'l': 'Controller Features', 'it': [I('vibe', 'Vibration & Haptics Strength', '10', S10), I('dz_l', 'Deadzone (Left Stick)', '5', S10), I('dz_r', 'Deadzone (Right Stick)', '5', S10)]},
            {'id': 'ds', 'l': 'DualSense Wireless Controller Features', 'only': 'playstation', 'it': [I('at_res', 'Adaptive Triggers Resistance', 'On', OO, only='playstation'),
                I('at_vib', 'Adaptive Triggers Vibration', 'On', OO, only='playstation'), I('speedlim', 'Adaptive Speed Limiter', 'On', OO, only='playstation'), I('lightbar', 'Light Bar Effect', 'On', OO, only='playstation')]}]},
        {'id': 'gameplay', 'l': 'Gameplay', 'sec': [
            {'id': 'combat', 'l': 'Combat', 'it': [I('targeting', 'Targeting', 'Partial', ['Lock-On', 'Partial', 'Free Aim']), I('aa', 'Aim Assist Strength', '4', ['0', '1', '2', '3', '4']),
                I('shoot_as', 'Shooting Assist', 'On', OO), I('driveby', 'Drive-By Assist', 'On', OO), I('quickdraw', 'Quick Draw', 'On', OO),
                I('cover', 'Cover Selection', 'Camera & Movement', ['Camera & Movement', 'Movement Only']), I('holster', 'Holster in Vehicle', 'Automatic', ['Automatic', 'Manual'])]},
            {'id': 'move', 'l': 'Movement', 'it': [I('movespeed', 'Movement Speed', 'Walk', ['Walk', 'Fast Walk', 'Jog', 'Run']), I('cmovespeed', 'Combat Movement Speed', 'Fast Walk', ['Walk', 'Fast Walk', 'Jog']), I('standsprint', 'Stand & Sprint', 'Off', OO)]},
            {'id': 'acc', 'l': 'Accessibility', 'it': [I('tap', 'Tap Assist', 'Off', ['Off', '2x', '3x', '4x', 'Hold']), I('holddelay', 'Hold Delay', 'Off'), I('holdassist', 'Hold Assist', 'Off'),
                I('focus', 'Focus', 'L3+R3'), I('dpad', 'Directional Button Actions', 'Hold', ['Hold', 'Hold & Release']), I('aiming', 'Aiming', 'Hold', ['Hold', 'Press']), I('interact', 'Interact', 'Hold', ['Hold', 'Press']),
                I('loadout', 'Loadout', 'Hold', ['Hold', 'Hold & Release']), I('fishing', 'Fishing', 'Rotate'), I('nitrous', 'Nitrous', 'Hold', ['Hold', 'Press']), I('minigames', 'Simplified Mini Games', 'Off', OO),
                I('autodrive', 'Auto Drive', 'Restricted', ['Restricted', 'Unrestricted']), I('helmet', 'Auto Equip Helmet', 'Off', OO), I('acc_combat', 'Accessible Combat', 'Off', OO), I('rvd', 'Reduced Vehicle Damage', 'Off', OO)]}]},
        {'id': 'display', 'l': 'Display', 'sec': [
            {'id': 'disp', 'l': 'Display', 'it': [I('hdr', 'HDR Calibration', '', ty='go'), I('safezone', 'Safe Zone', '', ty='go')]},
            {'id': 'vfx', 'l': 'Visual Effects', 'it': [I('pse', 'Player Status Effects Intensity', '5', S15), I('hit', 'Hit Effects Intensity', '5', S15), I('aware', 'Awareness Effects Intensity', '5', S15),
                I('blur', 'Motion Blur Strength', '3', S10), I('dismember', 'Dismemberment', 'On', OO), I('gore', 'Blood & Gore Intensity', 'High', ['Low', 'Medium', 'High']), I('flash', 'Flashbang', 'Bright', ['Bright', 'Dark']),
                I('focuscb', 'Focus Trail Colorblind Mode', 'Off', OO), I('brightred', 'Brightness Reduction', 'Off', OO)]},
            {'id': 'hcs', 'l': 'High Contrast Shaders', 'it': [I('hcs', 'High Contrast Shaders', 'Off', OO)]}]},
        {'id': 'ui', 'l': 'UI', 'sec': [
            {'id': 'read', 'l': 'Scaling & Readability', 'it': [I('lang', 'Language', 'English'), I('textsize', 'UI Text Size', 'Small', ['Small', 'Medium', 'Large', 'X Large']), I('colour', 'Color Adjustments', 'Off', ['Off', 'Protan', 'Deutan', 'Tritan']),
                I('mapblip', 'Map Blip Size', 'Default', ['Default', 'Large']), I('mmblip', 'Minimap Blip Size', 'Default', ['Default', 'Large']), I('marker', 'In-World Marker Size', 'Default', ['Default', 'Large'])]},
            {'id': 'subs', 'l': 'Subtitles & Captions', 'it': [I('subs', 'Subtitles', 'Off', ['Off', 'Mission Only', 'On']), I('cc', 'Closed Captions', 'Off', ['Off', 'Non-Speech', 'Environment', 'On']),
                I('subsize', 'Size', 'Small', ['Small', 'Medium', 'Large']), I('speaker', 'Speaker Names', 'Off', OO), I('subbg', 'Background', 'Off', ['Off', 'Transparent', 'Solid'])]},
            {'id': 'nav', 'l': 'Navigation', 'it': [I('minimap', 'Minimap', 'On', ['On', 'Dynamic', 'Off']), I('compass', 'Compass', 'Off', ['On', 'Dynamic', 'Off']), I('gpsturn', 'GPS Turn Indicators', 'On', ['On', 'Highways', 'Off']),
                I('iwm', 'In-World Markers', 'On', ['On', 'Off', 'Objectives']), I('door', 'Door Markers', 'On', ['On', 'Dynamic', 'Off'])]},
            {'id': 'ret', 'l': 'Reticle', 'it': [I('dot', 'Persistent Center Dot', 'Off', OO), I('hitmark', 'Reticle Hit Markers', 'On', OO), I('retsize', 'Reticle Size', 'Default', ['Default', 'Large']),
                I('retshape', 'Reticle Shape', 'Complex', ['Complex', 'Simple', 'Dot', 'None'])]}]},
        {'id': 'camera', 'l': 'Camera', 'sec': [
            {'id': 'foot', 'l': 'On Foot', 'it': [I('foot_h', 'Height', 'Medium', ['Low', 'Medium', 'High']), I('foot_fh', 'Horizontal Follow Speed', '10', S110), I('foot_fv', 'Vertical Follow Speed', '10', S110)]},
            {'id': 'veh', 'l': 'Land & Water Vehicles', 'it': [I('veh_h', 'Height (All Vehicles)', 'Medium', ['Low', 'Medium', 'High']), I('veh_fh', 'Horizontal Follow Speed (Driver)', '10', S110),
                I('veh_fv', 'Vertical Follow Speed (Driver)', '10', S110), I('veh_fd', 'Follow Delay (Driver)', '0', S10)]},
            {'id': 'comfort', 'l': 'Comfort', 'it': [I('sway', 'Weapon Sway', 'On', OO), I('shake', 'Camera Shake', 'On', OO), I('bob', 'Camera Bob', '10', S110), I('phone', 'Phone Display', 'Default', ['Default', 'First Person'])]},
            {'id': 'cine', 'l': 'Cinematic', 'it': [I('killshot', 'Cinematic Kill Shot Frequency', '3', S15), I('crash', 'Cinematic Vehicle Crash Frequency', '3', S15), I('idle', 'Idle Camera', 'On', OO)]}]},
        {'id': 'audio', 'l': 'Audio', 'sec': [
            {'id': 'setup', 'l': 'Setup', 'it': [I('mono', 'Mono Audio', 'Off', OO), I('tinnitus', 'Tinnitus Reduction', 'Off', OO), I('ctrlspk', 'Controller Speaker', 'On', OO, only='playstation'),
                I('scanner', 'Controller Cop Scanner', 'Off', OO), I('gpsvoice', 'GPS Voice', 'Off', ['On', 'Tones', 'Voice', 'Off']), I('mutelic', 'Mute Licensed Music', 'Off', OO), I('radio', 'Vehicle Radio', 'Default', ['Default', 'On', 'Off'])]},
            {'id': 'vol', 'l': 'Volume', 'it': [I('v_master', 'Master Volume', '10', S110), I('v_sfx', 'SFX Volume', '10', S110), I('v_dialog', 'Dialogue Volume', '10', S110), I('v_music', 'Music Volume', '10', S110)]}]},
        {'id': 'account', 'l': 'Account', 'sec': [{'id': 'rs', 'l': 'Rockstar Games', 'it': [I('support', 'Customer Support', '', ty='go')]}]},
    ],
    # PS5: Options, ✕, ○, L1/R1; Xbox: Menu, A, B, LB/RB. Значки PS — знаки X/O/S/T из js/icons.js, Xbox — буквы.
    'btn': {
        'playstation': {'pause': 'OPTIONS', 'confirm': 'X', 'back': 'O', 'tab_next': 'R1', 'tab_prev': 'L1', 'up': '↑', 'down': '↓', 'left': '←', 'right': '→'},
        'xbox': {'pause': 'MENU', 'confirm': 'A', 'back': 'B', 'tab_next': 'RB', 'tab_prev': 'LB', 'up': '↑', 'down': '↓', 'left': '←', 'right': '→'},
        'st': {'playstation': 'ok', 'xbox': 'check'},   # Решение Fable — система гида: Xbox «сверяем», пока нет своей записи меню
        'sure': {'pause': 'ok', 'tab_next': 'ok', 'tab_prev': 'ok', 'back': 'ok', 'confirm': 'rule', 'up': 'rule', 'down': 'rule', 'left': 'rule', 'right': 'rule'},
    },
    'src': {'A': 'Настройки — ресёрч/A', 'note': 'порядок групп по S1; Restore Default — кнопка не названа, в схеме не показываем'},
}

def T(ru, en): return {'ru': ru, 'en': en}
def st(id, it, set_, hn, why, src, only=None, hyp=False, ok=None):
    x = {'id': id, 'it': it, 'set': set_, 'hn': hn, 'why': why, 'src': src}
    if only: x['only'] = only
    if hyp: x['hyp'] = 1
    if ok: x['ok'] = ok
    return x
SN_B = ['playday.one', 'games.gg', 'Dexerto', 'Eurogamer', 'BGR']
GUIDES = [
  {'id': 'set-driving', 'sn': ['playday.one', 'games.gg', 'Dexerto', 'Eurogamer', 'BGR', 'VideoGamer'], 'how': {
    'ta': T('Настроить вождение', 'Set up driving'), 'rw': T('Чтобы не разбить Thrax и любую быструю машину.', "So you don't wreck the Thrax or any fast car."), 'min': 4,
    'st': [
      st('vibe', 'vibe', '6', T('Сила вибрации', 'Vibration strength'), T('Дорогу и удары чувствуешь, но руки не устают и вибрация не мешает рулить.', "You still feel the road and hits, but it won't tire your hands or throw off steering."), ['playday.one', 'Dexerto', 'games.gg']),
      st('at_res', 'at_res', 'Off', T('Сопротивление курков', 'Trigger resistance'), T('Газ без упора легче дозировать на гиперкаре, палец меньше устаёт.', 'Throttle without resistance is easier to feather on a hypercar.'), ['Dexerto', 'BGR'], only='playstation'),
      st('rvd', 'rvd', 'On', T('Машина прочнее', 'Tougher car'), T('Машина выдерживает больше ударов и пуль. Игра предупредит, что это меняет сложность. На трофеи не влияет, выключить можно в любой момент.', 'Your car takes more hits and bullets. The game warns it changes difficulty; trophies are unaffected and you can switch it off anytime.'), ['playday.one', 'games.gg', 'VideoGamer', 'notebookcheck']),
      st('blur', 'blur', '0', T('Без размытия', 'No motion blur'), T('На скорости картинка чёткая, дорогу читать легче. Если на 30 кадрах дёргается, поставьте 1.', 'The road stays sharp at speed. If 30 fps looks choppy, use 1.'), ['Eurogamer', 'BGR', 'VideoGamer', 'games.gg']),
      st('veh_h', 'veh_h', 'High', T('Камера выше', 'Higher camera'), T('Сверху видно дальше: поворот замечаешь за 2–3 секунды.', 'From higher up you see turns 2–3 seconds earlier.'), ['playday.one', 'games.gg', 'VideoGamer']),
      st('shake', 'shake', 'Off', T('Без тряски камеры', 'No camera shake'), T('Камеру не трясёт на скорости, легче держать траекторию.', 'No shaking at speed, easier to hold your line.'), ['games.gg', 'VideoGamer', 'playday.one']),
      st('bob', 'bob', '5', T('Меньше качки', 'Less camera bob'), T('Картинка меньше раскачивается в поворотах.', 'Less sway through corners.'), ['games.gg', 'playday.one']),
      st('crash', 'crash', '1', T('Реже кино после аварии', 'Fewer crash cutscenes'), T('Меньше замедленных повторов после столкновения, быстрее снова на дороге.', 'Fewer slow-mo replays after a crash, back on the road sooner.'), ['VideoGamer', 'games.gg']),
      st('gpsvoice', 'gpsvoice', 'Voice', T('Голос навигатора', 'GPS voice'), T('Голос подскажет поворот, не надо смотреть на мини-карту.', 'A voice calls the turns, so you keep your eyes on the road.'), ['playday.one', 'games.gg']),
    ],
    'next': [{'k': 'guide:gta6:egg-bugatti-thrax-andrew-node', 't': T('Угнать Bugatti без трекера', 'Steal the Bugatti with no tracker'), 's': T('Thrax, по шагам', 'Thrax, step by step')},
             {'k': 'guide:gta6:set-comfort', 't': T('Если укачивает в машине', 'If driving makes you dizzy'), 's': T('9 настроек комфорта', '9 comfort settings')},
             {'k': 'guide:gta6:set-aim', 't': T('Прицел: меньше промахов', 'Aim: fewer misses'), 's': T('Стрельба из машины и пешком', 'On foot and from the car')}]}},
  {'id': 'set-aim', 'sn': ['playday.one', 'games.gg', 'Dexerto', 'XP', 'FD', 'BM'], 'how': {
    'ta': T('Прицел: меньше промахов', 'Aim: fewer misses'), 'rw': T('Помощь прицела и чувствительность для геймпада.', 'Aim assist and sensitivity for a controller.'), 'min': 3,
    'st': [
      st('look_h', 'look_h', '8', T('Поворот камеры', 'Camera turn speed'), T('Быстрее разворачиваешься к цели, но без перелётов.', 'Turn to targets faster without overshooting.'), ['Dexerto', 'BM', 'games.gg']),
      st('aim_h', 'aim_h', '6', T('Скорость прицела', 'Aim speed'), T('Прицел медленнее камеры: меньше промахиваешься по бегущим.', 'Aim slower than the camera: fewer misses on moving targets.'), ['Dexerto', 'FD', 'XP']),
      st('aim_v', 'aim_v', '6', T('Прицел по вертикали', 'Vertical aim'), T('Точнее доводишь до головы.', 'Finer control for headshots.'), ['Dexerto', 'FD', 'XP']),
      st('dz_r', 'dz_r', '3', T('Мёртвая зона правого стика', 'Right stick deadzone'), T('Прицел отзывается на лёгкое касание. Если камера ползёт сама, прибавьте 1.', 'Aim reacts to light touches. If the camera drifts, add 1.'), ['Dexerto', 'BM', 'playday.one']),
      st('targeting', 'targeting', 'Lock-On', T('Захват цели', 'Target lock'), T('Прицел сам цепляется за врага. Опытным — Free Aim.', 'The reticle snaps to enemies. Experienced players: Free Aim.'), ['playday.one', 'BGR', 'XP', 'games.gg']),
      st('foot_h', 'foot_h', 'High', T('Камера пешком выше', 'Higher on-foot camera'), T('Видно поверх укрытий, меньше слепых зон.', 'See over cover, fewer blind spots.'), ['playday.one', 'games.gg', 'BM']),
      st('sway', 'sway', 'Off', T('Без качания оружия', 'No weapon sway'), T('Ствол не гуляет в прицеле.', "The weapon doesn't drift while aiming."), ['playday.one', 'games.gg']),
    ],
    'next': [{'k': 'guide:gta6:set-driving', 't': T('Настроить вождение', 'Set up driving'), 's': T('Чтобы не разбить Thrax', "So you don't wreck the Thrax")},
             {'k': 'guide:gta6:set-first', 't': T('Первые часы игры', 'Your first hours'), 's': T('5 настроек за 2 минуты', '5 settings in 2 minutes')}]}},
  {'id': 'set-comfort', 'sn': ['playday.one', 'games.gg', 'VideoGamer', 'Eurogamer'], 'how': {
    'ta': T('Чтобы не укачивало', 'Stop motion sickness'), 'rw': T('Включайте по одному и проверяйте 10 минут езды.', 'Turn on one at a time and test for 10 minutes of driving.'), 'min': 4,
    'st': [
      st('blur', 'blur', '0', T('Без размытия', 'No motion blur'), T('Размытие в движении — главная причина тошноты.', 'Motion blur is the top trigger for nausea.'), ['Eurogamer', 'BGR', 'games.gg', 'VideoGamer']),
      st('flash', 'flash', 'Dark', T('Тёмная вспышка', 'Dark flashbang'), T('Светошумовая не слепит белым экраном.', "Flashbangs won't blind you with a white screen."), ['playday.one', 'games.gg']),
      st('dot', 'dot', 'On', T('Точка в центре', 'Center dot'), T('Игра сама пишет: точка помогает глазам держаться за центр.', 'The game itself says the dot can help with motion sickness.'), ['playday.one', 'games.gg']),
      st('sway', 'sway', 'Off', T('Без качания оружия', 'No weapon sway'), T('Меньше лишнего движения в кадре.', 'Less extra movement on screen.'), ['playday.one', 'games.gg']),
      st('shake', 'shake', 'Off', T('Без тряски камеры', 'No camera shake'), T('Картинка не дрожит от взрывов и скорости.', "The picture doesn't shake from blasts or speed."), ['games.gg', 'VideoGamer', 'playday.one']),
      st('bob', 'bob', '2', T('Почти без качки', 'Minimal camera bob'), T('Камера не покачивается при ходьбе и езде.', "The camera barely bobs when walking or driving."), ['games.gg', 'playday.one']),
      st('killshot', 'killshot', '1', T('Реже кино при выстреле', 'Fewer kill cams'), T('Меньше резких смен камеры.', 'Fewer sudden camera cuts.'), ['playday.one', 'VideoGamer']),
      st('crash', 'crash', '1', T('Реже кино при аварии', 'Fewer crash cams'), T('Меньше замедленных повторов.', 'Fewer slow-mo replays.'), ['VideoGamer', 'games.gg']),
      st('idle', 'idle', 'Off', T('Без камеры простоя', 'No idle camera'), T('Камера не уезжает сама, пока вы стоите.', "The camera won't wander while you stand still."), ['playday.one', 'games.gg']),
    ],
    'next': [{'k': 'guide:gta6:set-picture', 't': T('Картинка на телевизоре', 'Picture on your TV'), 's': T('HDR и края экрана', 'HDR and screen edges')},
             {'k': 'guide:gta6:set-driving', 't': T('Настроить вождение', 'Set up driving'), 's': T('Чтобы не разбить Thrax', "So you don't wreck the Thrax")}]}},
  {'id': 'set-first', 'sn': ['playday.one', 'games.gg', 'VideoGamer', 'FD'], 'how': {
    'ta': T('Первые часы игры', 'Your first hours'), 'rw': T('Пять настроек, чтобы не потеряться и всё понимать.', 'Five settings so you never get lost and understand everything.'), 'min': 2,
    'st': [
      st('movespeed', 'movespeed', 'Jog', T('Бег без кнопки', 'Jog by default'), T('Полный наклон стика — бег трусцой, не надо жать бег всё время.', 'Full stick tilt jogs, no need to hold sprint.'), ['playday.one', 'FD', 'games.gg']),
      st('textsize', 'textsize', 'Medium', T('Крупнее текст', 'Bigger text'), T('По умолчанию текст мелкий. Large — если телевизор далеко.', 'Default text is small. Large if the TV is far away.'), ['playday.one', 'VideoGamer', 'games.gg']),
      st('subs', 'subs', 'On', T('Субтитры', 'Subtitles'), T('Не пропустите задание в шуме погони.', "Don't miss instructions during a chase."), ['playday.one', 'VideoGamer', 'games.gg']),
      st('subbg', 'subbg', 'Solid', T('Фон субтитров', 'Subtitle background'), T('Белый текст читается и на ярком пляже.', 'White text stays readable on a bright beach.'), ['playday.one', 'games.gg']),
      st('compass', 'compass', 'On', T('Компас', 'Compass'), T('Видно направление к цели, проще ориентироваться в Леонида.', 'Shows the direction to your goal across Leonida.'), ['playday.one', 'games.gg'], hyp=True),
    ],
    'next': [{'k': 'guide:gta6:set-driving', 't': T('Настроить вождение', 'Set up driving'), 's': T('Чтобы не разбить Thrax', "So you don't wreck the Thrax")},
             {'k': 'guide:gta6:set-aim', 't': T('Прицел: меньше промахов', 'Aim: fewer misses'), 's': T('Помощь прицела', 'Aim assist')}]}},
  {'id': 'set-picture', 'sn': ['Digital Foundry', 'playday.one', 'games.gg'], 'how': {
    'ta': T('Картинка на телевизоре', 'Picture on your TV'), 'rw': T('Выбирать режим не нужно: на PS5, PS5 Pro и Xbox игра идёт в 30 кадрах. Настройте яркость и края.', 'No mode to pick: PS5, PS5 Pro and Xbox all run at 30 fps. Set brightness and edges.'), 'min': 3,
    'st': [
      st('hdr', 'hdr', None, T('Калибровка HDR', 'HDR calibration'), T('Max Brightness — по пику яркости вашего ТВ, Black Levels — пока чёрный не перестанет быть серым, Paper White — чтобы меню не слепило. По умолчанию 600, 50, 50.', 'Max Brightness to your TV peak, Black Levels until black stops looking grey, Paper White so menus don’t glare. Defaults 600, 50, 50.'), ['playday.one', 'games.gg', 'Digital Foundry']),
      st('safezone', 'safezone', None, T('Края экрана', 'Safe zone'), T('Если мини-карта или деньги обрезаны краем ТВ, сдвиньте рамку внутрь.', 'If the minimap or cash is cut off by your TV edge, move the frame in.'), ['playday.one', 'games.gg']),
      st('blur', 'blur', '0', T('Без размытия', 'No motion blur'), T('Чётче в движении. На 30 кадрах кому-то приятнее 1–2.', 'Sharper in motion. At 30 fps some prefer 1–2.'), ['Eurogamer', 'BGR', 'games.gg']),
    ],
    'next': [{'k': 'guide:gta6:set-comfort', 't': T('Чтобы не укачивало', 'Stop motion sickness'), 's': T('9 настроек комфорта', '9 comfort settings')},
             {'k': 'guide:gta6:set-driving', 't': T('Настроить вождение', 'Set up driving'), 's': T('Чтобы не разбить Thrax', "So you don't wreck the Thrax")}]}},
]

ORDER = ['set-first', 'set-driving', 'set-aim', 'set-comfort', 'set-picture']
BUG = {'k': 'guide:gta6:egg-bugatti-thrax-andrew-node', 't': T('Угнать Bugatti без трекера', 'Steal the Bugatti with no tracker'), 's': T('Thrax, по шагам', 'Thrax, step by step')}
WALK = {'k': 'walk:gta6', 't': T('Прохождение: что сейчас важно', 'Walkthrough: what matters now'), 's': T('Дела до следующей миссии', 'Things to do before the next mission')}
# поисковые фразы (указатель гида, kw ≥ 8 на язык); общие + свои у совета
KW_ALL = {'ru': ['настройки gta 6', 'как настроить gta 6', 'лучшие настройки', 'настройки ps5', 'настройки xbox'],
          'en': ['gta 6 settings', 'best gta 6 settings', 'how to set up gta 6', 'ps5 settings', 'xbox settings']}
KW = {
  'set-first': {'ru': ['первые часы', 'новичку', 'субтитры', 'размер текста', 'бег без кнопки'], 'en': ['beginner settings', 'first hours', 'subtitles', 'text size', 'auto run']},
  'set-driving': {'ru': ['настройки вождения', 'как не разбить машину', 'вибрация геймпада', 'камера в машине', 'урон машины'], 'en': ['driving settings', 'vehicle damage', 'car camera', 'vibration', 'handling']},
  'set-aim': {'ru': ['настройки прицела', 'чувствительность', 'помощь прицеливания', 'мёртвая зона', 'захват цели'], 'en': ['aim settings', 'sensitivity', 'aim assist', 'deadzone', 'lock-on']},
  'set-comfort': {'ru': ['укачивает', 'тошнит от игры', 'размытие', 'тряска камеры', 'морская болезнь'], 'en': ['motion sickness', 'nausea', 'motion blur', 'camera shake', 'dizzy']},
  'set-picture': {'ru': ['hdr', 'яркость', 'графика gta 6', 'режим производительности', '30 кадров'], 'en': ['hdr settings', 'brightness', 'graphics settings', 'performance mode', '30 fps']},
}
UPD = '2026-11-26'

def check():
    idx = {it['id']: it for t in MENU['tabs'] for s in t['sec'] for it in s['it']}
    bad = []
    ids = {g['id'] for g in GUIDES}
    for g in GUIDES:
        for x in g['how']['st']:
            it = idx.get(x['it'])
            if not it: bad.append(f"{g['id']}/{x['id']}: пункта {x['it']} нет в меню"); continue
            if x['set'] is not None and it.get('o') and x['set'] not in it['o']: bad.append(f"{g['id']}/{x['id']}: значения {x['set']} нет у {it['l']}")
            if x['set'] is not None and x['set'] == it['v']: bad.append(f"{g['id']}/{x['id']}: совет = значение по умолчанию")
            if len(x['src']) < 2 and not x.get('hyp'): bad.append(f"{g['id']}/{x['id']}: < 2 источников")
            for f in ('hn', 'why'):
                if not (x[f].get('ru') and x[f].get('en')): bad.append(f"{g['id']}/{x['id']}: нет RU/EN в {f}")
            if it.get('only') and x.get('only') != it['only']: bad.append(f"{g['id']}/{x['id']}: пункт только {it['only']}, у шага нет only")
        for n in g['how'].get('next', []):
            if n['k'].startswith('guide:gta6:set-') and n['k'].split(':')[2] not in ids: bad.append(f"{g['id']}: Дальше на несуществующий {n['k']}")
        if not g['how'].get('next'): bad.append(f"{g['id']}: пустой «Дальше»")
    return bad

if __name__ == '__main__':
    bad = check()
    if bad: print('СТОП:\n ' + '\n '.join(bad)); sys.exit(1)
    byid = {g['id']: g for g in GUIDES}
    GUIDES[:] = [byid[i] for i in ORDER]
    for n, g in enumerate(GUIDES):   # «Дальше»: следующий совет → Bugatti → Прохождение (таблица удержания Fable, раздел 4)
        nx = GUIDES[(n + 1) % len(GUIDES)]
        g['how']['next'] = [{'k': f"guide:gta6:{nx['id']}", 't': nx['how']['ta'], 's': nx['how']['rw']}, BUG, WALK]
        g['how']['upd'] = UPD
    old = {}
    if os.path.exists(OUT):
        try: old = {g['id']: g['how'].get('vid') for g in json.load(open(OUT, encoding='utf-8'))['guides']}
        except Exception: pass
    idx = {it['id']: it for t in MENU['tabs'] for s in t['sec'] for it in s['it']}
    for g in GUIDES:
        for x in g['how']['st']: x['t'] = {'ru': idx[x['it']]['l'], 'en': idx[x['it']]['l']}; x['val'] = {'ru': x['set'], 'en': x['set']} if x['set'] is not None else {'ru': 'Настроить', 'en': 'Adjust'}; x['def'] = idx[x['it']]['v'] or None
        if old.get(g['id']): g['how']['vid'] = old[g['id']]
    index = []
    for g in GUIDES:   # записи указателя гида (data/guide/index-<игра>.json собирает tools/build_guide_index.py сборщика)
        h = g['how']; n_ok = min(len(x['src']) for x in h['st'])
        kw = {l: KW_ALL[l] + KW[g['id']][l] for l in ('ru', 'en')}
        assert all(len(kw[l]) >= 8 for l in kw), g['id']
        index.append({'k': f"guide:gta6:{g['id']}", 'kind': 'set', 't': h['ta'], 'sub': h['rw'], 'sp': 0,
                      'st': 'ok' if n_ok >= 2 else 'one', 'src_n': len(g['sn']), 'upd': UPD, 'steps_n': len(h['st']), 'min': h['min'],
                      'free': True, 'kw': kw, 'next': [q['k'] for q in h['next'] if not q['k'].startswith('walk:')]})   # walk — когда «Прохождение» будет в указателе
    ENTRIES = os.path.join(os.path.dirname(OUT), 'entries-settings-gta6.json')   # записи для указателя гида (tools/build_guide_index.py сборщика)
    json.dump({'items': index}, open(ENTRIES, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump({'v': 1, 'game': 'gta6', 'upd': UPD, 'menu': MENU, 'guides': GUIDES}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('ok', OUT, sum(len(g['how']['st']) for g in GUIDES), 'шагов в', len(GUIDES), 'советах')
