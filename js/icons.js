// Иконки (SVG, без брендовых логотипов) и отрисовка кнопок геймпада.

const s = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const I = {
  home: s('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  search: s('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  heart: s('<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'),
  heartFill: s('<path fill="currentColor" d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'),
  gear: s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  share: s('<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: s('<path d="m9 6 6 6-6 6"/>'),
  check: s('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  lock: s('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  play: s('<path fill="currentColor" stroke="none" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
  stop: s('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none"/>'),
  copy: s('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>'),
  star: s('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
  info: s('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  reset: s('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  globe: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  moon: s('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  vibe: s('<rect x="8" y="3" width="8" height="18" rx="2"/><path d="M4 8v8M20 8v8"/>'),
  gamepad: s('<path d="M6 9h4M8 7v4M15 10h.01M18 8h.01"/><path d="M7.5 4h9A5.5 5.5 0 0 1 22 9.5v3.8a3.7 3.7 0 0 1-6.6 2.3L14 14h-4l-1.4 1.6A3.7 3.7 0 0 1 2 13.3V9.5A5.5 5.5 0 0 1 7.5 4z"/>'),
  crown: s('<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>'),
  pin: s('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  locate: s('<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/>'),
  fit: s('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>'),
  back: s('<path d="m15 6-6 6 6 6"/>'),
  sparkle: s('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  map: s('<path d="M9 4 3.6 6.2a1 1 0 0 0-.6.9V19.5a.5.5 0 0 0 .7.5L9 18l6 2 5.4-2.2a1 1 0 0 0 .6-.9V4.5a.5.5 0 0 0-.7-.5L15 6z"/><path d="M9 4v14M15 6v14"/>'),
  egg: s('<path d="M12 3c3.6 0 6.5 5.4 6.5 10.2A6.5 6.5 0 0 1 12 21a6.5 6.5 0 0 1-6.5-7.8C5.5 8.4 8.4 3 12 3z"/><path d="M8.5 12.5l2 1.5 1.5-1.5 1.5 1.5 2-1.5"/>'),
  // Категории кодов (Мир, Игрок, Оружие, Транспорт) — сетка 24, линия 2, currentColor
  catWorld: s('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
  catPlayer: s('<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6"/>'),
  catWeapon: s('<circle cx="12" cy="12" r="7"/><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5"/>'),
  catVehicle: s('<path d="M5 13l1.8-4.6A2 2 0 0 1 8.7 7h6.6a2 2 0 0 1 1.9 1.4L19 13"/><rect x="3.5" y="13" width="17" height="5" rx="1.5"/><path d="M7 18v1.5M17 18v1.5"/>'),
  // Категории мест (places.js CAT_LABELS → id значка; без категории — I.pin)
  plBuilding: s('<rect x="5" y="3" width="10" height="18" rx="1"/><path d="M15 9h3a1 1 0 0 1 1 1v11M3 21h18M8.5 7h3M8.5 11h3M8.5 15h3"/>'),
  plHood: s('<path d="M4 11l8-6.5 8 6.5V20h-5.5v-5h-5v5H4z"/>'),
  plStore: s('<path d="M4 9l1.5-4h13L20 9M4 9h16v10H4zM10 19v-5h4v5"/>'),
  plLandmark: s('<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>'),
  plBridge: s('<path d="M2 17h20M4 17v3M20 17v3M2 9c3 0 5 3.5 10 3.5S19 9 22 9M7 11.2V17M12 12.5V17M17 11.2V17"/>'),
  plVenue: s('<path d="M4 10h16M6 10v9h12v-9M9 19v-5h6v5M12 4l8 6H4z"/>'),
  plRoad: s('<path d="M8 3 4 21M16 3l4 18M12 4v2.5M12 10.5v3M12 17.5V20"/>'),
  plNature: s('<path d="M12 21v-9"/><path d="M12 12c-1-3.5-4-5.5-8-5 1.5 3 4.5 4.6 8 5zM12 12c1-3.5 4-5.5 8-5-1.5 3-4.5 4.6-8 5zM12 12c-2.2-2-2.4-5.6 0-9 2.4 3.4 2.2 7 0 9z"/>'),
  plStreet: s('<path d="M12 3v18M8 21h8"/><path d="M12 5h6.5l2 2-2 2H12M12 11H5.5l-2 2 2 2H12"/>'),
  plPark: s('<path d="M12 21v-5M8 21h8"/><path d="M12 16a5 5 0 0 1-5-5 5 5 0 0 1 1.3-3.4A4 4 0 0 1 12 3a4 4 0 0 1 3.7 4.6A5 5 0 0 1 17 11a5 5 0 0 1-5 5z"/>'),
  plBeach: s('<path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1"/><path d="M12 4a8 8 0 0 1 8 8H4a8 8 0 0 1 8-8zM12 12l2.5 6"/>'),
  plSign: s('<rect x="3" y="4" width="18" height="10" rx="1.5"/><path d="M8 14v7M16 14v7M7 9h10"/>'),
  // Платформы — нейтральные пиктограммы
  ps: s('<path d="M6 9h4M8 7v4"/><circle cx="15.5" cy="9.5" r="1"/><circle cx="18" cy="12" r="1"/><path d="M7.5 4h9A5.5 5.5 0 0 1 22 9.5v3.8a3.7 3.7 0 0 1-6.6 2.3L14 14h-4l-1.4 1.6A3.7 3.7 0 0 1 2 13.3V9.5A5.5 5.5 0 0 1 7.5 4z"/>'),
  xbox: s('<circle cx="12" cy="12" r="9"/><path d="M8 7.5c2 1.5 6 6.5 8 9.5M16 7.5c-2 1.5-6 6.5-8 9.5"/>'),
  pc: s('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  phone: s('<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
};

export const platformIcon = (id) => I[{ playstation: 'ps', xbox: 'xbox', pc: 'pc', phone: 'phone' }[id]] || I.gamepad;

// ─── Кнопки геймпада ───
const PS_FACE = {
  O: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="#FF5A5F" stroke-width="2.4"/></svg>',
  X: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke="#7C9CFF" stroke-width="2.4" stroke-linecap="round"/></svg>',
  T: '<svg viewBox="0 0 24 24"><path d="M12 5.2 19.2 18H4.8z" fill="none" stroke="#3DDC97" stroke-width="2.3" stroke-linejoin="round"/></svg>',
  S: '<svg viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="1.5" fill="none" stroke="#F472B6" stroke-width="2.3"/></svg>',
};
const XB_FACE = { A: '#3DDC97', B: '#FF5A5F', X: '#5AA9FF', Y: '#FACC15' };
const ARROW = {
  '←': 'M19 12H5m6-6-6 6 6 6', '→': 'M5 12h14m-6-6 6 6-6 6',
  '↑': 'M12 19V5m-6 6 6-6 6 6', '↓': 'M12 5v14m-6-6 6 6 6-6',
};

// token → {html, cls, speakKey}
export function btn(token, platform) {
  if (ARROW[token]) {
    return { cls: 'k k-arrow', html: `<svg viewBox="0 0 24 24"><path d="${ARROW[token]}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`, speak: token };
  }
  if (platform === 'playstation' && PS_FACE[token]) return { cls: 'k k-face', html: PS_FACE[token], speak: token };
  if (platform === 'xbox' && XB_FACE[token]) return { cls: 'k k-face k-xb', html: `<span style="color:${XB_FACE[token]}">${token}</span>`, speak: 'x' + token };
  return { cls: 'k k-text', html: token, speak: token };
}

export function comboHTML(tokens, platform, big = false) {
  return `<div class="combo${big ? ' combo-big' : ''}">${tokens.map((tk, i) => {
    const b = btn(tk, platform);
    return `<span class="${b.cls}" data-i="${i}">${b.html}</span>`;
  }).join('')}</div>`;
}
