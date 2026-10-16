// v2 «Стекло над городом»: эпохи (скины) и смена игры.
// Скин меняет только фото, один акцент и экран загрузки (DESIGN.md, The One Accent Rule); каркас общий.
// Смена игры — табло города + вид сверху, ≤ 2,5 с, пропуск тапом, офлайн (картинки в кэше), reduced-motion → растворение 200 мс.
// Слой — position: absolute внутри body (без fixed: баг WebKit 301994, css/layout.css).

import { getLang } from './i18n.js';

// год — время действия игры (03 идентика/тон.md §6); фото — 05 картинки, MVP-набор
export const ERAS = {
  gta6: { city: { ru: 'Майами', en: 'Miami' }, year: 2026, game: 'GTA 6', lat: '25.77° N', banners: ['gta6-banner-01', 'gta6-banner-02', 'gta6-banner-04'], load: 'gta6-load-02' },
  gta5: { city: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, year: 2013, game: 'GTA 5', lat: '34.05° N', banners: ['gta5-banner-01', 'gta5-banner-02', 'gta5-banner-03'], load: 'gta5-load-01' },
  gta4: { city: { ru: 'Нью-Йорк', en: 'New York' }, year: 2008, game: 'GTA 4', lat: '40.71° N', banners: ['gta4-banner-01'], load: 'gta4-load-01' },
  // без своих фото: Vice City — Майами 80-х (фото GTA 6), GTA 3 — Нью-Йорк (фото GTA 4); акцент — по умолчанию
  vc: { city: { ru: 'Майами', en: 'Miami' }, year: 1986, game: 'GTA Vice City', lat: '25.77° N', banners: ['gta6-banner-02', 'gta6-banner-04'], load: 'gta6-load-02' },
  g3: { city: { ru: 'Нью-Йорк', en: 'New York' }, year: 2001, game: 'GTA 3', lat: '40.71° N', banners: ['gta4-banner-01'], load: 'gta4-load-01' },
  sa: { city: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, year: 1992, game: 'GTA San Andreas', lat: '34.05° N', banners: ['sa-banner-02', 'sa-banner-01'], load: 'sa-load-01' },
};
// id игры в config.js → скин
const GAME_SKIN = { gta6: 'gta6', gta5: 'gta5', gta4: 'gta4', gtasa: 'sa', gtavc: 'vc', gta3: 'g3' };
export const skinOf = (gameId) => GAME_SKIN[gameId] || null;
export const eraOf = (gameId) => ERAS[skinOf(gameId)] || null;
export const cityOf = (gameId) => { const e = eraOf(gameId); return e ? e.city[getLang()] || e.city.ru : ''; };
// «Майами — GTA 6»; годы в подписях убраны (Игорь 16.10.2026)
export const eraCaption = (gameId) => { const e = eraOf(gameId); return e ? `${cityOf(gameId)} — ${e.game}` : ''; };

const src = (name, ext) => `img/ui/${name.split('-')[0]}/${name}.${ext}`;   // папка — по префиксу имени файла
// <picture> AVIF → WebP; первый баннер грузится сразу, остальные лениво
export function pic(name, { cls = '', eager = false, alt = '' } = {}) {
  return `<picture class="${cls}"><source srcset="${src(name, 'avif')}" type="image/avif"><img src="${src(name, 'webp')}" alt="${alt}" decoding="async" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'}></picture>`;
}
export const imgUrl = (name) => src(name, 'webp');
// все картинки эпохи — для прогрева кэша service worker
export const skinAssets = (skin) => { const e = ERAS[skin]; return e ? [...e.banners, e.load].flatMap((n) => [src(n, 'avif'), src(n, 'webp')]) : []; };

export function applySkin(gameId) {
  const s = skinOf(gameId);
  if (s) document.documentElement.dataset.skin = s; else delete document.documentElement.dataset.skin;
}

function warm(skin) {   // попросить service worker держать картинки эпохи в кэше (офлайн-смена игры)
  navigator.serviceWorker?.controller?.postMessage({ type: 'warm', urls: skinAssets(skin) });
}
export function warmAll() { Object.keys(ERAS).forEach(warm); }

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_MS = 2500;
let busy = null;

// Табло: буквы города падают по одной, как на перекидном табло в аэропорту
const flap = (txt, cls) => `<span class="${cls}">${[...txt].map((ch, i) => ch === ' ' ? '<i class="sp"></i>' : `<i style="--d:${i}">${ch}</i>`).join('')}</span>`;

// Сменить игру: накрыть экран, под слоем поставить скин и перерисовать (apply), снять слой.
export function switchTo(gameId, apply, { label = '', skip = '' } = {}) {
  if (busy) return busy;
  const skin = skinOf(gameId), era = ERAS[skin];
  if (!era) { applySkin(gameId); return Promise.resolve(apply?.()); }
  warm(skin);
  const cover = document.createElement('div');
  cover.id = 'skin-cover';
  cover.setAttribute('role', 'status');
  cover.innerHTML = `
    <div class="sc-photo">${pic(era.load, { eager: true })}</div>
    <div class="sc-board">
      ${flap(cityOf(gameId).toUpperCase(), 'sc-city')}
      <span class="sc-cap">${era.game}${label ? `, ${label}` : ''}</span>
      <span class="sc-bar"><i></i></span>
    </div>
    <span class="sc-skip">${skip}</span>`;
  const rm = reduce();
  cover.classList.toggle('rm', rm);
  document.body.appendChild(cover);
  const t0 = performance.now();
  busy = new Promise((resolve) => {
    let done = false, applied = false;
    const doApply = async () => {
      if (applied) return; applied = true;
      applySkin(gameId);
      try { await apply?.(); } catch { }
    };
    const finish = async () => {
      if (done) return; done = true;
      clearTimeout(tApply); clearTimeout(tOut); clearTimeout(tHard);
      await doApply();
      cover.classList.add('out');
      setTimeout(() => { cover.remove(); busy = null; window.__lastSwitchMs = Math.round(performance.now() - t0); resolve(); }, rm ? 200 : 320);
    };
    // пропуск: тап по слою или любая клавиша — сразу конечное состояние
    cover.addEventListener('pointerdown', finish, { once: true });
    addEventListener('keydown', finish, { once: true });
    requestAnimationFrame(() => cover.classList.add('in'));
    // reduced-motion: растворение без движения
    const tApply = setTimeout(doApply, rm ? 60 : 700);
    const tOut = setTimeout(finish, rm ? 200 : 1880);
    const tHard = setTimeout(finish, MAX_MS - 330);   // жёсткий потолок: что бы ни зависло, через 2,5 с интерфейс виден
  });
  return busy;
}
