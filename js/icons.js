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
  sparkle: s('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
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
