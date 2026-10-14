// Настройки приложения: игры, платформы, категории.
// Добавить игру = добавить запись в GAMES и файл data/<id>.json.

export const APP = {
  name: 'Чит-коды GTA',
  version: '0.1.0 demo',
};

export const CATEGORIES = [
  { id: 'world', icon: '🌍', ru: 'Мир', en: 'World' },
  { id: 'player', icon: '🧍', ru: 'Игрок', en: 'Player' },
  { id: 'weapon', icon: '🔫', ru: 'Оружие', en: 'Weapon' },
  { id: 'vehicle', icon: '🚗', ru: 'Транспорт', en: 'Vehicle' },
];
export const DEFAULT_CATEGORY = 'vehicle';

export const PLATFORMS = {
  playstation: { ru: 'PlayStation', en: 'PlayStation', icon: 'ps' },
  xbox: { ru: 'Xbox', en: 'Xbox', icon: 'xbox' },
  pc: { ru: 'ПК', en: 'PC', icon: 'pc' },
  phone: { ru: 'Телефон в игре', en: 'In-Game Phone', icon: 'phone' },
};

// status: 'live' — коды проверены; 'forecast' — игра ещё не вышла, коды-прогноз; 'soon' — раздел в разработке
export const GAMES = [
  {
    id: 'gta5', title: 'GTA 5', header: { ru: 'GTA 5 чит-коды', en: 'GTA 5 Cheat Codes' },
    status: 'live',
    platforms: ['playstation', 'xbox', 'pc', 'phone'],
    platformNote: {},
  },
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
  { id: 'gtasa', title: 'GTA San Andreas', status: 'soon' },
  { id: 'gtavc', title: 'GTA Vice City', status: 'soon' },
  { id: 'gta4', title: 'GTA 4', status: 'soon' },
  { id: 'gta3', title: 'GTA 3', status: 'soon' },
];

export const PAYWALL = {
  plans: [
    { id: 'week', ru: 'Неделя', en: 'Weekly', price: '$4.99', per: { ru: '/ нед.', en: '/ week' }, trial: true },
    { id: 'year', ru: 'Год', en: 'Yearly', price: '$9.99', per: { ru: '/ год', en: '/ year' }, badge: { ru: '−96%', en: '−96%' } },
    { id: 'life', ru: 'Навсегда', en: 'Lifetime', price: '$24.99', per: { ru: 'разово', en: 'one-time' } },
  ],
};
