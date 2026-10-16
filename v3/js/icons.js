// Значки (свой набор, спрайт js/sprite.js) и отрисовка кнопок геймпада. Эмодзи нет.

import { ic, mountSprite } from './sprite.js';
import { CATEGORIES } from './config.js';

mountSprite();

// Все прежние ключи I.* сохранены (их зовёт app.js через innerHTML и передаёт в map.js), значения — <use> из спрайта.
export const I = {
  // прежние ключи
  home: ic('home'),
  search: ic('search'),
  heart: ic('heart'),
  heartFill: ic('heart-fill'),
  gear: ic('settings'),
  share: ic('share'),
  close: ic('close'),
  chevron: ic('chevron-right'),
  check: ic('check'),
  lock: ic('lock'),
  play: ic('play'),
  stop: ic('stop'),
  copy: ic('copy'),
  star: ic('star'),
  info: ic('info'),
  reset: ic('reset'),
  globe: ic('globe'),
  moon: ic('moon'),
  vibe: ic('haptics'),
  gamepad: ic('game'),
  crown: ic('crown-pro'),
  pin: ic('pin'),
  locate: ic('locate'),
  fit: ic('fit'),
  back: ic('chevron-left'),
  sparkle: ic('sparkle'),
  // платформы — нейтральные пиктограммы, не логотипы
  ps: ic('playstation'),
  xbox: ic('xbox'),
  pc: ic('pc'),
  phone: ic('phone'),
  // новые ключи (контракт v2)
  voice: ic('voice'),
  route: ic('route'),
  trip: ic('trip'),
  layers: ic('layers'),
  compare: ic('compare'),
  swap: ic('swap'),
  world: ic('world'),
  player: ic('player'),
  weapon: ic('weapon'),
  vehicle: ic('vehicle'),
  camera: ic('camera'),
  want: ic('want'),
  been: ic('been'),
  sun: ic('sun'),
  help: ic('help'),
  more: ic('more'),
  offline: ic('offline'),
  video: ic('video'),
  photos: ic('photos'),
  filter: ic('filter'),
  plus: ic('plus'),
  minus: ic('minus'),
  expand: ic('expand'),
  unlock: ic('unlock'),
  empty: ic('empty'),
  alert: ic('alert'),
  translate: ic('translate'),
  settings: ic('settings'),
  map: ic('map'),
  // заливки вкладок и прочее из набора
  homeFill: ic('home-fill'),
  mapFill: ic('map-fill'),
  settingsFill: ic('settings-fill'),
  chevronDown: ic('chevron-down'),
  externalMaps: ic('external-maps'),
  pause: ic('pause'),
  egg: ic('sparkle'), // пасхалка (вместо эмодзи-яйца)
};

export const platformIcon = (id) => I[{ playstation: 'ps', xbox: 'xbox', pc: 'pc', phone: 'phone' }[id]] || I.gamepad;

// ─── Значки кодов: id кода → символ спрайта (04 дизайн-система/иконки/коды-соответствие.tsv) ───
const CHEAT_ICON = {
  // GTA 5
  sanchez: 'cheat-dirt-bike', pcj600: 'cheat-motorbike', caddy: 'cheat-golf-cart',
  rapidgt: 'cheat-sports-car', comet: 'cheat-sports-car', stretch: 'cheat-limo',
  trashmaster: 'cheat-truck', bmx: 'cheat-bicycle', buzzard: 'cheat-helicopter',
  duster: 'cheat-crop-duster', mallard: 'cheat-stunt-plane', dodo: 'cheat-seaplane',
  duke: 'cheat-armored-car', kraken: 'cheat-submarine', weapons: 'cheat-weapons',
  flaming: 'cheat-fire-ammo', explosive_ammo: 'cheat-explosive-ammo', explosive_melee: 'cheat-explosive-melee',
  slowmo_aim: 'cheat-aim-slowmo', invincible: 'cheat-invincible', health: 'cheat-health',
  parachute: 'cheat-parachute', superjump: 'cheat-super-jump', fastrun: 'cheat-fast-run',
  fastswim: 'cheat-fast-swim', recharge: 'cheat-recharge', skyfall: 'cheat-skyfall',
  drunk: 'cheat-drunk', wanted_up: 'cheat-wanted-up', wanted_down: 'cheat-wanted-down',
  weather: 'cheat-weather', gravity: 'cheat-moon-gravity', slidey: 'cheat-slidey-cars',
  slowmo: 'cheat-slow-time', cellphone: 'cheat-phone', director: 'cheat-director',
  // GTA 6
  g6_health: 'cheat-health', g6_invincible: 'cheat-invincible', g6_weapons: 'cheat-weapons',
  g6_wanted_down: 'cheat-wanted-down', g6_wanted_up: 'cheat-wanted-up', g6_parachute: 'cheat-parachute',
  g6_superjump: 'cheat-super-jump', g6_fastrun: 'cheat-fast-run', g6_fastswim: 'cheat-fast-swim',
  g6_skyfall: 'cheat-skyfall', g6_drunk: 'cheat-drunk', g6_recharge: 'cheat-recharge',
  g6_flaming: 'cheat-fire-ammo', g6_explosive_ammo: 'cheat-explosive-ammo', g6_explosive_melee: 'cheat-explosive-melee',
  g6_slowmo_aim: 'cheat-aim-slowmo', g6_weather: 'cheat-weather', g6_gravity: 'cheat-moon-gravity',
  g6_slidey: 'cheat-slidey-cars', g6_slowmo: 'cheat-slow-time', g6_v_super: 'cheat-sports-car',
  g6_v_bike: 'cheat-motorbike', g6_v_heli: 'cheat-helicopter', g6_v_plane: 'cheat-stunt-plane',
  g6_v_limo: 'cheat-limo', g6_v_dirt: 'cheat-dirt-bike', g6_n_stamina: 'cheat-stamina',
  g6_n_boat: 'cheat-boat', g6_n_gator: 'cheat-alligator',
};

// Имя символа для кода: свой значок → значок категории → «игра».
export function cheatIconName(c) {
  const id = typeof c === 'string' ? c : c?.id;
  if (CHEAT_ICON[id]) return CHEAT_ICON[id];
  const cat = c && typeof c === 'object' ? CATEGORIES.find((x) => x.id === c.category) : null;
  return cat ? cat.icon : 'game';
}
// cheatIcon(c | id, cls) → разметка SVG
export const cheatIcon = (c, cls = '') => ic(cheatIconName(c), ('ic-cheat ' + cls).trim());

// ─── Кнопки геймпада ───
// PS — бесцветные символы, как на DualSense; Xbox — буквы в фирменных цветах. Цвет — переменной --k-sym
// с запасом на токен платформы: для состояния «текущий шаг» CSS задаёт на .k, например, --k-sym: var(--accent-ink).
const PS_FACE = { X: 'ps-cross', O: 'ps-circle', T: 'ps-triangle', S: 'ps-square' };
const XB_FACE = { A: 'a', B: 'b', X: 'x', Y: 'y' };
const ARROW = { '←': 'dpad-left', '→': 'dpad-right', '↑': 'dpad-up', '↓': 'dpad-down' };

// token → {html, cls, speak}
export function btn(token, platform) {
  if (ARROW[token]) return { cls: 'k k-arrow', html: ic(ARROW[token]), speak: token };
  if (platform === 'playstation' && PS_FACE[token]) {
    return { cls: 'k k-face', html: ic(PS_FACE[token]).replace('<svg ', '<svg style="color:var(--k-sym, var(--pad-ps))" '), speak: token };
  }
  if (platform === 'xbox' && XB_FACE[token]) {
    return { cls: 'k k-face k-xb', html: `<span style="color:var(--k-sym, var(--pad-xb-${XB_FACE[token]}))">${token}</span>`, speak: 'x' + token };
  }
  return { cls: 'k k-text', html: token, speak: token };
}

export function comboHTML(tokens, platform, big = false) {
  return `<div class="combo${big ? ' combo-big' : ''}">${tokens.map((tk, i) => {
    const b = btn(tk, platform);
    return `<span class="${b.cls}" data-i="${i}">${b.html}</span>`;
  }).join('')}</div>`;
}

export { ic, mountSprite };
