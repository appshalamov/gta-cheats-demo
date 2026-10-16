// Настройки приложения: игры, платформы, категории.
// Добавить игру = добавить запись в GAMES и файл data/<id>.json.

export const APP = {
  name: 'Secret Base — Cheats & Codes GTA 6',
  shortName: 'Secret Base',
  version: '0.3.1 demo',
};

// icon — id значка из I (js/icons.js), не эмодзи
export const CATEGORIES = [
  { id: 'world', icon: 'catWorld', ru: 'Мир', en: 'World' },
  { id: 'player', icon: 'catPlayer', ru: 'Игрок', en: 'Player' },
  { id: 'weapon', icon: 'catWeapon', ru: 'Оружие', en: 'Weapon' },
  { id: 'vehicle', icon: 'catVehicle', ru: 'Транспорт', en: 'Vehicle' },
];
export const DEFAULT_CATEGORY = 'vehicle';

export const PLATFORMS = {
  playstation: { ru: 'PlayStation', en: 'PlayStation', icon: 'ps' },
  xbox: { ru: 'Xbox', en: 'Xbox', icon: 'xbox' },
  pc: { ru: 'ПК', en: 'PC', icon: 'pc' },
  phone: { ru: 'Телефон в игре', en: 'In-game phone', icon: 'phone' },
};

// Порядок — как в списках и переключателях интерфейса: GTA 6 первой (решение Игоря №15, 16.10.2026).
// Игра по умолчанию — store.game в app.js (GTA 5), от порядка не зависит.
// Другие части (status 'soon') — только коды, без карты: карта и места есть только у GTA 6 и GTA 5 (places.js MAP_GAMES).
// status: 'live' — коды проверены; 'forecast' — игра ещё не вышла, коды-прогноз; 'soon' — раздел в разработке
export const GAMES = [
  {
    id: 'gta6', title: 'GTA 6', header: { ru: 'Коды GTA 6', en: 'GTA 6 codes' },
    status: 'forecast', release: '2026-11-19',
    platforms: ['playstation', 'xbox', 'phone', 'pc'],
    platformNote: {
      playstation: { ru: 'PS5', en: 'PS5' },
      xbox: { ru: 'Series X|S', en: 'Series X|S' },
      pc: { ru: 'ожидается в 2027', en: 'expected in 2027' },
    },
  },
  {
    id: 'gta5', title: 'GTA 5', header: { ru: 'Коды GTA 5', en: 'GTA 5 codes' },
    status: 'live',
    platforms: ['playstation', 'xbox', 'pc', 'phone'],
    platformNote: {},
  },
  { id: 'gtasa', title: 'GTA San Andreas', status: 'soon' },
  { id: 'gtavc', title: 'GTA Vice City', status: 'soon' },
  { id: 'gta4', title: 'GTA 4', status: 'soon' },
  { id: 'gta3', title: 'GTA 3', status: 'soon' },
];

// Фото эпохи на Главной (04 дизайн-система/tokens.json → skins.<id>.photos): порядок листания, фокус обрезки 50% 0%.
// Файлы — img/ui/<скин>/<имя>.avif и .webp. Обложки категорий и карточки игр не используются.
// load — «вид» во весь экран (860×1864, фокус по центру): пейвол и онбординг «Игра» (бриф §7).
export const HERO = {
  gta6: { city: { ru: 'Майами', en: 'Miami' }, banners: ['img/ui/gta6/gta6-banner-01', 'img/ui/gta6/gta6-banner-02', 'img/ui/gta6/gta6-banner-04'], load: 'img/ui/gta6/gta6-load-02' },
  gta5: { city: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, banners: ['img/ui/gta5/gta5-banner-01', 'img/ui/gta5/gta5-banner-02', 'img/ui/gta5/gta5-banner-03'], load: 'img/ui/gta5/gta5-load-01' },
};

export const PAYWALL = {
  plans: [
    { id: 'week', ru: 'Неделя', en: 'Weekly', price: '$4.99', per: { ru: '/ нед.', en: '/ week' }, trial: true },
    { id: 'year', ru: 'Год', en: 'Yearly', price: '$9.99', per: { ru: '/ год', en: '/ year' }, badge: { ru: '−96%', en: '−96%' } },
    { id: 'life', ru: 'Навсегда', en: 'Lifetime', price: '$24.99', per: { ru: 'разово', en: 'one-time' } },
  ],
};
