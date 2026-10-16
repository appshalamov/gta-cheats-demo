// Настройки приложения: игры, платформы, категории.
// Добавить игру = добавить запись в GAMES и файл data/<id>.json.

// Ссылки — единая схема всех веток (трассировка 33 п. 13): домен/КОД/мир/место, у ролика ?v=<id>; до своего домена
// middleware feature/foundation отдаёт приложению ?ref=КОД&open=<вид>:<игра>:<id>. Домен — заглушка до запуска.
export const LINK_DOMAIN = 'secretbase.app';

export const APP = {
  name: 'Secret Base: карта и чит-коды',
  shortName: 'Secret Base',
  version: '0.3.1 demo',
};

// icon — имя значка спрайта (js/sprite.js), не эмодзи
export const CATEGORIES = [
  { id: 'world', icon: 'world', ru: 'Мир', en: 'World' },
  { id: 'player', icon: 'player', ru: 'Игрок', en: 'Player' },
  { id: 'weapon', icon: 'weapon', ru: 'Оружие', en: 'Weapon' },
  { id: 'vehicle', icon: 'vehicle', ru: 'Транспорт', en: 'Vehicle' },
];
export const DEFAULT_CATEGORY = 'vehicle';

export const PLATFORMS = {
  playstation: { ru: 'PlayStation', en: 'PlayStation', icon: 'ps' },
  xbox: { ru: 'Xbox', en: 'Xbox', icon: 'xbox' },
  pc: { ru: 'ПК', en: 'PC', icon: 'pc' },
  phone: { ru: 'Телефон в игре', en: 'In-Game Phone', icon: 'phone' },
};

// status: 'live' — коды проверены; 'forecast' — игра ещё не вышла, коды-прогноз; 'soon' — раздел в разработке
// Порядок (Игорь 16.10.2026): GTA 6 первой. Карта — только у GTA 6 и GTA 5 (places.js MAP_GAMES), остальные — только коды.
export const GAMES = [
  {
    id: 'gta6', title: 'GTA 6', header: { ru: 'GTA 6 чит-коды', en: 'GTA 6 Cheat Codes' },
    status: 'forecast', release: '2026-11-19',
    platforms: ['playstation', 'xbox', 'phone', 'pc'],
    platformNote: {
      playstation: { ru: 'PS5', en: 'PS5' },
      xbox: { ru: 'Series X|S', en: 'Series X|S' },
      pc: { ru: 'ожидается в 2027', en: 'expected 2027' },
    },
  },
  {
    id: 'gta5', title: 'GTA 5', header: { ru: 'GTA 5 чит-коды', en: 'GTA 5 Cheat Codes' },
    status: 'live',
    platforms: ['playstation', 'xbox', 'pc', 'phone'],
    platformNote: {},
  },
  // только коды, без карты (Игорь 16.10.2026); данные — data/<id>.json, сверены по 2 источникам из 3
  { id: 'gtasa', title: 'GTA San Andreas', header: { ru: 'GTA San Andreas коды', en: 'GTA San Andreas codes' }, status: 'live', platforms: ['playstation', 'xbox', 'pc'], platformNote: {} },
  { id: 'gtavc', title: 'GTA Vice City', header: { ru: 'GTA Vice City коды', en: 'GTA Vice City codes' }, status: 'live', platforms: ['playstation', 'xbox', 'pc'], platformNote: {} },
  { id: 'gta4', title: 'GTA 4', header: { ru: 'GTA 4 коды', en: 'GTA 4 codes' }, status: 'live', platforms: ['phone'], platformNote: { phone: { ru: 'на всех платформах', en: 'on every platform' } } },
  { id: 'gta3', title: 'GTA 3', header: { ru: 'GTA 3 коды', en: 'GTA 3 codes' }, status: 'live', platforms: ['playstation', 'xbox', 'pc'], platformNote: {} },
];

// Тарифы — аналитика, файл 31 (16.10.2026): только платные, пробный доступ 3 дня (коды, без карты и заработка, без банковской карты).
// Pro в трёх сроках, цены пояса 1 (США, Европа, Залив); пояса 2–4 — 31 §1 п. 2, подставит касса по стране.
export const PAYWALL = {
  trialHours: 72,
  release: '2026-11-19',
  plans: [
    { id: 'year', card: true, ru: 'Год', en: 'Year', price: 29.99, perMonth: 2.50, tag: { ru: 'Выгоднее всего', en: 'Best value' },
      note: { ru: 'Продлевается раз в год, напомним за 7 дней, отмена в один тап', en: 'Renews yearly, we remind you 7 days before, cancel in one tap' } },
    { id: 'pass', card: true, ru: '3 месяца', en: '3 months', price: 12.99,
      note: { ru: 'Один платёж, без автопродления', en: 'One payment, no auto-renewal' } },
    { id: 'month', ru: 'Помесячно', en: 'Monthly', price: 5.99, note: { ru: 'отмена в один тап', en: 'cancel in one tap' } },
  ],
};
