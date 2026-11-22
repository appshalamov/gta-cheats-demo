// Secret Base — сайт-презентация (sbgta.app/about/, 22.11.2026). Данные мест — about/places.json (tools/build_about.py,
// из data/map приложения), коды — из data/gta6.json и gta5.json. Язык: ?lang=ru|en, иначе язык телефона (как в приложении).
(() => {
  const T = {
    ru: {
      h1: 'Места из GTA —<br>в реальной жизни',
      lead: 'Secret Base — приложение-спутник GTA 6 и GTA 5. Карта настоящих мест, сравнение «в игре ⇄ в жизни» с одного ракурса и чит-коды с кнопками вашего контроллера.',
      open: 'Открыть приложение', pdf: 'Скачать презентацию', contact: 'Связаться',
      qr: 'Смотрите с компьютера? Наведите камеру телефона — откроется sbgta.app.',
      ins_h: 'Поставьте за минуту — прямо с сайта',
      ins_sub: 'App Store — скоро. Google Play — скоро. Сейчас — с сайта sbgta.app.',
      ins1: 'Откройте sbgta.app в Safari, нажмите «•••» у адресной строки, затем «Поделиться».',
      ins2: 'Выберите «На экран „Домой“».',
      ins3: 'Нажмите «Добавить». Переключатель «Открыть как веб-приложение» оставьте включённым.',
      ins4: 'Значок Secret Base появится среди ваших приложений.',
      ins_other: 'Android: Chrome, меню с тремя точками, «Добавить на главный экран». iOS 18 и раньше: «Поделиться» в нижней панели Safari, затем «На экран „Домой“».',
      cmp_h: 'Один жест: слева игра, справа то же место сегодня',
      cmp_sub: 'Потяните ручку — кадр из игры сменится фотографией настоящего места. Так в приложении устроена карточка места.',
      st_h: 'Города GTA списаны с настоящих',
      st_p: 'GTA 6 вышла 19 ноября 2026 года. Её улицы, отели и мосты повторяют Майами и Флориду, а GTA 5 — Лос‑Анджелес. Secret Base показывает, где именно.',
      pl_h: '486 мест на карте Майами и Лос‑Анджелеса',
      pl_sub: 'Нажмите на место — откроется сравнение. Ниже карта: каждая точка — место из игры в настоящем городе.',
      more: 'Показать все места',
      mia: 'Майами', la: 'Лос‑Анджелес', keys: 'Флорида‑Кис',
      map_wait: 'Загружаем карту…', map_hint: 'Нажмите на точку — покажем, что это за место.',
      open_place: 'Открыть в приложении', maps: 'Открыть в Картах', compare_it: 'Сравнить',
      in_h: 'Что внутри',
      f1_h: 'Карта «Жизнь ⇄ Игра»', f1_p: 'Один переключатель: настоящий город с точками мест или мир игры. Нашли место в игре — видно, где оно в жизни, и наоборот.',
      f2_h: 'Карточка места', f2_p: '418 сравнений «в игре — в жизни», фото, вид 360° с улицы и кнопка «Открыть в Картах», чтобы приехать самому.',
      f3_h: 'Чит-коды', f3_p: '54 кода для GTA 6 и GTA 5 нарисованы кнопками вашего контроллера: PlayStation, Xbox или ПК. Приложение читает код вслух, пока вы вводите. Пример — рядом.',
      f4_h: 'Поиск и пасхалки', f4_p: 'Поиск по кодам и местам, избранное, 47 пасхалок. Русский и английский, тёмная и светлая тема.',
      say: 'Озвучить', saying: 'Читаю…',
      who_h: 'Кому это подходит',
      w1: 'Игроку', w1p: 'Коды под рукой и места, которые стоит найти — в игре и в жизни.',
      w2: 'Путешественнику', w2p: 'Готовые точки в Майами и Лос‑Анджелесе: открыл в Картах и приехал.',
      w3: 'Автору роликов', w3p: 'Сюжет в каждом месте: кадр из игры и то же место в жизни, с одного ракурса.',
      w4: 'Партнёру', w4p: 'Приложение, которое связывает большую игру с настоящими городами, с первых дней GTA 6.',
      ln_h: 'Каждое место — это ссылка',
      ln_p: 'В мессенджере она выглядит как картинка «игра | жизнь». Отправьте другу или поставьте под роликом — откроется сразу это место.',
      og_t: 'Ocean Drive — в игре и в жизни',
      end_h: 'Из игры —<br>в жизнь',
      end_p: 'Работает уже сейчас на iPhone и Android. Пробный доступ — три дня.',
      stores: 'App Store — скоро. Google Play — скоро. Сейчас — с сайта.',
      wa: 'WhatsApp',
      disc: 'Неофициальное приложение. Не связано с Rockstar Games и Take-Two Interactive. Кадры игры — © Rockstar Games; фото — с автором и лицензией.',
      game: 'В игре', real: 'В жизни', cap_g: 'Кадр игры', cap_r: 'Фото', close: 'Закрыть',
      wa_text: 'Здравствуйте! Пишу по поводу Secret Base.',
    },
    en: {
      h1: 'GTA places<br>in real life',
      lead: 'Secret Base is a companion app for GTA 6 and GTA 5: a map of real places, a “game ⇄ real life” comparison from the same angle, and cheat codes drawn as your controller’s buttons.',
      open: 'Open the app', pdf: 'Download the deck', contact: 'Contact us',
      qr: 'On a computer? Point your phone camera here to open sbgta.app.',
      ins_h: 'Install it in a minute, right from the website',
      ins_sub: 'App Store: coming soon. Google Play: coming soon. Right now: from sbgta.app.',
      ins1: 'Open sbgta.app in Safari, tap “•••” next to the address bar, then “Share”.',
      ins2: 'Choose “Add to Home Screen”.',
      ins3: 'Tap “Add”. Leave “Open as Web App” switched on.',
      ins4: 'The Secret Base icon appears among your apps.',
      ins_other: 'Android: Chrome, the three-dot menu, “Add to Home screen”. iOS 18 and earlier: “Share” in Safari’s bottom bar, then “Add to Home Screen”.',
      cmp_h: 'One swipe: the game on the left, the same place today on the right',
      cmp_sub: 'Drag the handle and the game frame turns into a photo of the real place. Every place card in the app works this way.',
      st_h: 'GTA’s cities are modeled on real ones',
      st_p: 'GTA 6 came out on November 19, 2026. Its streets, hotels and bridges follow Miami and Florida, and GTA 5 follows Los Angeles. Secret Base shows exactly where.',
      pl_h: '486 places on the map of Miami and Los Angeles',
      pl_sub: 'Tap a place to compare. Below is the map: every dot is a place from the game in a real city.',
      more: 'Show all places',
      mia: 'Miami', la: 'Los Angeles', keys: 'Florida Keys',
      map_wait: 'Loading the map…', map_hint: 'Tap a dot to see the place.',
      open_place: 'Open in the app', maps: 'Open in Maps', compare_it: 'Compare',
      in_h: 'Inside the app',
      f1_h: 'Map: Real ⇄ Game', f1_p: 'One switch: the real city with places on it, or the game world. Found a spot in the game? See where it is in real life, and the other way round.',
      f2_h: 'Place card', f2_p: '418 game-vs-real-life comparisons, photos, a 360° street view and an “Open in Maps” button to go there yourself.',
      f3_h: 'Cheat codes', f3_p: '54 codes for GTA 6 and GTA 5, drawn as your controller’s buttons: PlayStation, Xbox or PC. The app can read a code aloud while you enter it. Try the example.',
      f4_h: 'Search and easter eggs', f4_p: 'Search across codes and places, favorites, 47 easter eggs. English and Russian, dark and light themes.',
      say: 'Read aloud', saying: 'Reading…',
      who_h: 'Who it is for',
      w1: 'Players', w1p: 'Codes at hand and places worth finding, in the game and in real life.',
      w2: 'Travelers', w2p: 'Ready-made spots in Miami and Los Angeles: open in Maps and go.',
      w3: 'Creators', w3p: 'A story in every place: the game frame and the same spot in real life, from the same angle.',
      w4: 'Partners', w4p: 'An app that connects a blockbuster game with real cities, from the first days of GTA 6.',
      ln_h: 'Every place is a link',
      ln_p: 'In a messenger it shows up as a “game | real life” picture. Send it to a friend or put it under a video, and it opens that exact place.',
      og_t: 'Ocean Drive, in the game and in real life',
      end_h: 'From the game<br>to real life',
      end_p: 'Live now on iPhone and Android. Three-day trial.',
      stores: 'App Store: coming soon. Google Play: coming soon. Right now: from the website.',
      wa: 'WhatsApp',
      disc: 'Unofficial app. Not affiliated with Rockstar Games or Take-Two Interactive. Game frames © Rockstar Games; photos credited with author and license.',
      game: 'In game', real: 'Real life', cap_g: 'Game frame', cap_r: 'Photo', close: 'Close',
      wa_text: 'Hi! I am writing about Secret Base.',
    },
  };
  const q = new URLSearchParams(location.search);
  const devRu = /^(ru|uk|be|kk)\b/i.test(navigator.language || '');
  let lang = q.get('lang') === 'en' || q.get('lang') === 'ru' ? q.get('lang') : (devRu ? 'ru' : 'en');
  try { if (!q.get('lang')) lang = localStorage.getItem('sb.about.lang') || lang; } catch { }
  if (q.has('deck')) document.documentElement.classList.add('deck');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const t = (k) => String(T[lang][k] ?? T.ru[k] ?? k).replace(/ —/g, '\u00a0—');   // тире не уходит в начало строки
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // подписи авторства из данных приложения — по-русски; для английского переводим служебные слова
  const credit = (s) => lang === 'ru' ? s : String(s).replace(/Трейлер/g, 'Trailer').replace(/официальный скриншот/g, 'official screenshot')
    .replace(/кадр через/g, 'frame via').replace(/через/g, 'via').replace(/автор не указан/g, 'author unknown');
  const APP = 'https://sbgta.app/';
  const placeUrl = (k) => `${APP}?open=place:${k}`;
  const mapsUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`;
  const nameOf = (p) => (lang === 'ru' ? p.ru : p.en);

  let D = { dots: [], top: [] };

  // ───── ползунок «в игре ⇄ в жизни» ─────
  const KNOB = '<svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>';
  function cmpHTML(p) {
    return `<img class="r" src="${esc(p.real.f)}" alt="${esc(t('real'))}" draggable="false">
      <img class="g" src="${esc(p.game.f)}" alt="${esc(t('game'))}" draggable="false">
      <div class="line"><span class="knob">${KNOB}</span></div>
      <span class="lab lg">${esc(t('game'))}</span><span class="lab lr">${esc(t('real'))}</span>`;
  }
  const capHTML = (p) => `${esc(t('cap_g'))}: ${esc(credit(p.game.c))}. ${esc(t('cap_r'))}: ${esc(credit(p.real.c))}.`;
  function setCmp(el, p, x = 50) {
    el.innerHTML = cmpHTML(p);
    el.style.setProperty('--x', x + '%');
    el.setAttribute('role', 'slider'); el.setAttribute('aria-label', `${t('game')} ⇄ ${t('real')}`);
    el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', String(x)); el.tabIndex = 0;
  }
  function bindCmp(el) {
    let id = null;
    const at = (e) => { const r = el.getBoundingClientRect(); const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
      el.style.setProperty('--x', x.toFixed(2) + '%'); el.setAttribute('aria-valuenow', String(Math.round(x))); el.dataset.touched = '1'; };
    el.addEventListener('pointerdown', (e) => { if (e.button > 0) return; id = e.pointerId; el.setPointerCapture?.(id); at(e); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === id) at(e); });
    const up = (e) => { if (e.pointerId === id) id = null; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', (e) => {
      const cur = parseFloat(el.style.getPropertyValue('--x')) || 50, d = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
      if (!d) return; e.preventDefault(); const x = Math.max(0, Math.min(100, cur + d)); el.style.setProperty('--x', x + '%'); el.setAttribute('aria-valuenow', String(x)); el.dataset.touched = '1';
    });
  }
  // подсказка жестом: ручка сама сходит влево-вправо один раз, пока человек не трогал
  function hint(el) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('deck')) return;
    const keys = [50, 22, 78, 50], dur = 2600, t0 = performance.now();
    const step = (now) => {
      if (el.dataset.touched) return;
      const k = Math.min(1, (now - t0) / dur), seg = k * (keys.length - 1), i = Math.min(keys.length - 2, Math.floor(seg)), f = seg - i;
      const e = f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
      el.style.setProperty('--x', (keys[i] + (keys[i + 1] - keys[i]) * e).toFixed(2) + '%');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function onceVisible(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); fn(); } }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(el);
  }

  // ───── пары, плашки, окно места ─────
  let pairI = 1;   // в первом экране — первая пара, здесь — следующая, чтобы не повторяться
  function renderPairs() {
    const hero = D.top.filter((p) => p.hero);
    if (!hero.length) return;
    setCmp($('#cmp-hero'), hero[0]); $('#cap-hero').textContent = '';
    $('#cap-hero').innerHTML = `${esc(nameOf(hero[0]))}, ${esc(hero[0].city)}. ${capHTML(hero[0])}`;
    const big = hero[Math.min(pairI, hero.length - 1)] || hero[0];
    setCmp($('#cmp-big'), big); $('#cap-big').innerHTML = capHTML(big);
    $('#pairs').innerHTML = hero.map((p, i) => `<button role="tab" aria-selected="${i === pairI}" class="${i === pairI ? 'on' : ''}" data-i="${i}">${esc(nameOf(p))}<small>${esc(p.city)}</small></button>`).join('');
  }
  function renderTiles() {
    $('#tiles').innerHTML = D.top.map((p, i) => `<button class="tile" data-i="${i}">
      <span class="pic"><img src="${esc(p.game.t)}" alt="" loading="lazy"><img src="${esc(p.real.t)}" alt="" loading="lazy"></span>
      <b>${esc(nameOf(p))}</b><span>${esc(p.city)}, ${p.g === 'gta6' ? 'GTA 6' : 'GTA 5'}</span></button>`).join('')
      + (D.top.length > 12 ? `<button class="tile tile-more b b-line" id="more">${esc(t('more'))}</button>` : '');
    const m = $('#more'); if (m) m.style.display = matchMedia('(min-width: 1100px)').matches ? '' : 'none';
  }
  let lastFocus = null;
  function openPlace(p) {
    lastFocus = document.activeElement;
    setCmp($('#cmp-ov'), p); $('#ov-name').textContent = nameOf(p);
    $('#ov-city').textContent = `${p.city}, ${p.g === 'gta6' ? 'GTA 6' : 'GTA 5'}`;
    $('#ov-open').href = placeUrl(p.k); $('#ov-maps').href = mapsUrl(p); $('#ov-cap').innerHTML = capHTML(p);
    $('#ov-x').setAttribute('aria-label', t('close'));
    $('#ov').hidden = false; document.body.style.overflow = 'hidden'; $('#ov-x').focus();
  }
  function closePlace() { $('#ov').hidden = true; document.body.style.overflow = ''; lastFocus?.focus?.(); }

  // ───── карта (MapLibre из приложения, чистая подложка без меток сообщества) ─────
  const VIEWS = { mia: { center: [-80.19, 25.79], zoom: 10.3 }, la: { center: [-118.32, 34.04], zoom: 9.6 }, keys: { center: [-81.0, 24.85], zoom: 7.9 } };
  let map = null;
  function loadMap() {
    if (map || document.documentElement.classList.contains('deck')) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '../vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = '../vendor/maplibre/maplibre-gl.js';
    s.onload = () => {
      $('#map').innerHTML = '';
      map = new maplibregl.Map({ container: 'map', style: 'https://tiles.openfreemap.org/styles/positron', ...VIEWS.mia,
        attributionControl: { compact: true }, cooperativeGestures: true, dragRotate: false, pitchWithRotate: false });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('load', () => {
        map.addSource('pl', { type: 'geojson', data: { type: 'FeatureCollection', features: D.dots.map((d, i) => ({ type: 'Feature', properties: { i }, geometry: { type: 'Point', coordinates: [d[2], d[1]] } })) } });
        map.addLayer({ id: 'pl', type: 'circle', source: 'pl', paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 3.5, 12, 7, 15, 10], 'circle-color': '#e8476c',
          'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.6 } });
        map.on('click', 'pl', (e) => showDot(e.features[0].properties.i));
        map.on('mouseenter', 'pl', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'pl', () => { map.getCanvas().style.cursor = ''; });
      });
    };
    s.onerror = () => { $('#map .map-wait') && ($('#map .map-wait').textContent = ''); };
    document.head.appendChild(s);
  }
  function showDot(i) {
    const d = D.dots[i]; if (!d) return;
    const [k, , , en, ru, city, img] = d, top = D.top.findIndex((p) => p.k === k);
    $('#map-info').innerHTML = `${img ? `<img src="${esc(img)}" alt="">` : ''}<div><b>${esc(lang === 'ru' ? ru : en)}</b>${city ? `<span>${esc(city)}</span>` : ''}
      <a href="${esc(placeUrl(k))}">${esc(t('open_place'))}</a>${top >= 0 ? ` <a href="#" data-top="${top}">${esc(t('compare_it'))}</a>` : ''}</div>`;
  }

  // ───── пример кода с кнопками контроллера ─────
  const ARROW = { '←': 'M19 12H5m6-6-6 6 6 6', '→': 'M5 12h14m-6-6 6 6-6 6', '↑': 'M12 19V5m-6 6 6-6 6 6', '↓': 'M12 5v14m-6-6 6 6 6-6' };
  const PSF = {
    O: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg>', X: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    T: '<svg viewBox="0 0 24 24"><path d="M12 5.5l6.5 11.5h-13z"/></svg>', S: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/></svg>',
  };
  const XBF = { A: 'xa', B: 'xb', X: 'xx', Y: 'xy' };
  const SAY = {
    ru: { '↑': 'вверх', '↓': 'вниз', '←': 'влево', '→': 'вправо', O: 'круг', X: 'крест', T: 'треугольник', S: 'квадрат' },
    en: { '↑': 'up', '↓': 'down', '←': 'left', '→': 'right', O: 'circle', X: 'cross', T: 'triangle', S: 'square' },
  };
  let CODES = [], ci = 0, plat = 'playstation';
  const PLAT = { playstation: 'PlayStation', xbox: 'Xbox', pc: { ru: 'ПК', en: 'PC' } };
  function keyHTML(tk) {
    if (ARROW[tk]) return `<span class="k"><svg viewBox="0 0 24 24"><path d="${ARROW[tk]}"/></svg></span>`;
    if (plat === 'playstation' && PSF[tk]) return `<span class="k">${PSF[tk]}</span>`;
    if (plat === 'xbox' && XBF[tk]) return `<span class="k ${XBF[tk]}">${tk}</span>`;
    return `<span class="k txt">${esc(tk)}</span>`;
  }
  function renderCode() {
    const c = CODES[ci]; if (!c) return;
    const plats = ['playstation', 'xbox', 'pc'].filter((p) => c.codes[p]);
    if (!plats.includes(plat)) plat = plats[0];
    $('#code-pick').innerHTML = CODES.map((x, i) => `<button class="${i === ci ? 'on' : ''}" data-c="${i}">${x.game}</button>`).join('');
    $('#plat-pick').innerHTML = plats.map((p) => `<button class="${p === plat ? 'on' : ''}" data-p="${p}">${esc(typeof PLAT[p] === 'string' ? PLAT[p] : PLAT[p][lang])}</button>`).join('');
    $('#code-name').textContent = c.name[lang] || c.name.ru;
    $('#code-hold').textContent = c.hold ? c.hold[lang][plat] || '' : '';
    const seq = c.codes[plat];
    $('#combo').innerHTML = Array.isArray(seq) ? seq.map(keyHTML).join('') : `<span class="k txt">${esc(seq)}</span>`;
    $('#code-src').textContent = c.src ? c.src[lang] : '';
    $('#say span').textContent = t('say');
  }
  let saying = 0;
  function sayCode() {
    const c = CODES[ci], seq = c && c.codes[plat]; if (!seq) return;
    const run = ++saying, keys = $$('#combo .k'), list = Array.isArray(seq) ? seq : [seq];
    const synth = window.speechSynthesis, voice = synth?.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    $('#say span').textContent = t('saying');
    let i = 0;
    const next = () => {
      if (run !== saying) return;
      keys.forEach((k) => k.classList.remove('now'));
      if (i >= list.length) { $('#say span').textContent = t('say'); return; }
      keys[i]?.classList.add('now');
      const word = SAY[lang][list[i]] && (plat === 'playstation' || ARROW[list[i]]) ? SAY[lang][list[i]] : String(list[i]).replace(/(\D)(\d)/, '$1 $2');
      i++;
      if (synth && typeof SpeechSynthesisUtterance === 'function') {
        const u = new SpeechSynthesisUtterance(word); u.lang = lang === 'ru' ? 'ru-RU' : 'en-US'; if (voice) u.voice = voice; u.rate = 1.05;
        let done = false; const go = () => { if (!done) { done = true; setTimeout(next, 90); } };
        u.onend = go; u.onerror = go; setTimeout(go, 1600); synth.speak(u);
      } else setTimeout(next, 650);
    };
    synth?.cancel(); next();
  }

  // ───── язык ─────
  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i]').forEach((el) => { const k = el.dataset.i; if (T.ru[k] !== undefined) el.innerHTML = t(k); });
    $$('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
    $$('img[data-src]').forEach((im) => { im.src = im.dataset.src.replace('{l}', lang); });
    const pdf = `Secret-Base-presentation-${lang.toUpperCase()}.pdf`;
    $$('.js-pdf').forEach((a) => { a.href = pdf; a.setAttribute('download', pdf); });
    const wa = `https://wa.me/17473448896?text=${encodeURIComponent(t('wa_text'))}`;
    $$('.js-wa').forEach((a) => { a.href = wa; });
    document.title = lang === 'ru' ? 'Secret Base — места из GTA в реальной жизни' : 'Secret Base — GTA places in real life';
    const og = D.top.find((p) => p.k === 'gta6:gta6-ocean-drive-art-deco');
    if (og) $('#og-img').innerHTML = `<img src="${esc(og.game.t)}" alt=""><img src="${esc(og.real.t)}" alt=""><span class="lab lg">${esc(t('game'))}</span><span class="lab lr">${esc(t('real'))}</span>`;
    $('#og-title').textContent = t('og_t');
    renderPairs(); renderTiles(); renderCode();
  }

  // ───── события ─────
  document.addEventListener('click', (e) => {
    const L = e.target.closest('.lang button');
    if (L) { lang = L.dataset.lang; try { localStorage.setItem('sb.about.lang', lang); } catch { } const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u); applyLang(); return; }
    const P = e.target.closest('#pairs button');
    if (P) { pairI = +P.dataset.i; renderPairs(); return; }
    if (e.target.closest('#more')) { $('#tiles').classList.add('all'); e.target.closest('#more').remove(); return; }
    const tile = e.target.closest('.tile[data-i]');
    if (tile) { openPlace(D.top[+tile.dataset.i]); return; }
    const top = e.target.closest('[data-top]');
    if (top) { e.preventDefault(); openPlace(D.top[+top.dataset.top]); return; }
    if (e.target.closest('#ov-x') || e.target.id === 'ov') { closePlace(); return; }
    const mt = e.target.closest('#map-tabs button');
    if (mt) { $$('#map-tabs button').forEach((b) => b.classList.toggle('on', b === mt)); map?.flyTo({ ...VIEWS[mt.dataset.c], duration: 900 }); return; }
    const cb = e.target.closest('#code-pick button');
    if (cb) { saying++; ci = +cb.dataset.c; renderCode(); return; }
    const pb = e.target.closest('#plat-pick button');
    if (pb) { saying++; plat = pb.dataset.p; renderCode(); return; }
    if (e.target.closest('#say')) sayCode();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#ov').hidden) closePlace(); });
  ['#cmp-hero', '#cmp-big', '#cmp-ov'].forEach((s) => bindCmp($(s)));

  // ───── данные ─────
  const codeOf = async (g, id) => { const d = await fetch(`../data/${g}.json`).then((r) => r.json()); return d.cheats.find((x) => x.id === id); };
  Promise.all([
    fetch('places.json').then((r) => r.json()),
    codeOf('gta6', 'g6_money').catch(() => null),
    codeOf('gta5', 'bmx').catch(() => null),
  ]).then(([pl, c6, c5]) => {
    D = pl;
    CODES = [];
    if (c6) CODES.push({ game: 'GTA 6', name: c6.name, codes: { playstation: c6.codes.playstation, xbox: c6.codes.xbox },
      hold: { ru: { playstation: 'Сначала ↑ — телефон, затем зажать L1 + R1 и набрать стрелки.', xbox: 'Сначала ↑ — телефон, затем зажать LB + RB и набрать стрелки.' },
        en: { playstation: 'First ↑ for the phone, then hold L1 + R1 and enter the arrows.', xbox: 'First ↑ for the phone, then hold LB + RB and enter the arrows.' } },
      src: { ru: 'Подтверждён двумя источниками: GameSpot и PowerPyx.', en: 'Confirmed by two sources: GameSpot and PowerPyx.' } });
    if (c5) CODES.push({ game: 'GTA 5', name: c5.name, codes: c5.codes });
    applyLang();
    onceVisible($('#cmp-hero'), () => setTimeout(() => hint($('#cmp-hero')), 500));
    onceVisible($('#cmp-big'), () => hint($('#cmp-big')));
    onceVisible($('#map'), loadMap);
    document.documentElement.dataset.ready = '1';
  }).catch(() => { applyLang(); document.documentElement.dataset.ready = '1'; });
  applyLang();
})();
