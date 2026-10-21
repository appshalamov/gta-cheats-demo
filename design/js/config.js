// Настройки приложения: игры, платформы, категории.
// Добавить игру = добавить запись в GAMES и файл data/<id>.json.

export const APP = {
  name: 'Secret Base: карта и чит-коды',   // 32 §3.1; «GTA» в имени нельзя (ASRG 4.1(c), 00 §14)
  shortName: 'Secret Base',
  version: '0.3.1 demo',
  // домен ссылок креаторов домен/КОД/мир/место?v=<ролик> — ЗАГЛУШКА: настоящий покупает и вписывает feature/foundation
  domain: 'secretbase.example',
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
  gta6: { city: { ru: 'Майами', en: 'Miami' }, banners: ['img/ui/gta6/gta6-banner-01', 'img/ui/gta6/gta6-banner-02', 'img/ui/gta6/gta6-banner-03'], load: 'img/ui/gta6/gta6-load-02' },
  gta5: { city: { ru: 'Лос-Анджелес', en: 'Los Angeles' }, banners: ['img/ui/gta5/gta5-banner-01', 'img/ui/gta5/gta5-banner-02', 'img/ui/gta5/gta5-banner-03'], load: 'img/ui/gta5/gta5-load-01' },
};

// Тарифы — только платные (Ресерч 31 §1, §4.4–4.6; решение Игоря №14; 28 §6.0 «Файл 31 принят»).
// Пробный доступ 72 часа с первого открытия: все коды; без карты игр, Лиги и «Моего заработка», без банковской карты.
// Дальше один Pro в трёх сроках: год (автопродление), «Пропуск релиза» 3 месяца одним платежом, месяц (автопродление).
// На пейволе две карточки (год, 3 месяца) и строка «Помесячно». Без недели, «навсегда», вводной цены, процентных скидок,
// пробного Paddle и Apple ID. «Поездки» в Pro нет (решение №15).
// Пояса цен — 31 §1 п. 2 и §4.6. Месяц в поясах 2–4 — только в App Store и Google Play (на сайте Paddle съедает мелкий
// платёж), поэтому в PWA строка «Помесячно» есть только в поясе 1.
// Пояс задаёт страна карты оплаты, не язык и не IP. НАСТОЯЩУЮ СТРАНУ ДАСТ СЕРВЕР (профиль SB.api country, Paddle);
// до него — мок-профиль или регион navigator.language, только для показа. Цены — в долларах, на сайте с налогами внутри.
export const PAYWALL = {
  trialHours: 72,
  release: '2026-11-19',        // пропуск, купленный до этой даты, отсчитывает 3 месяца с неё (31 §4.4)
  giftDays: 30,                 // код креатора и ссылка друга: +30 дней к первой покупке (31 §4.4)
  scouts: 0,                    // строка «Новые пары Скаутов: N, +M за неделю» — только при N > 0
  zones: {
    1: { year: 29.99, pass: 12.99, month: 5.99 },   // США, Европа, Залив
    2: { year: 17.99, pass: 7.99, month: null },    // Мексика, Польша, Чили
    3: { year: 11.99, pass: 4.99, month: null },    // Бразилия, Казахстан, Филиппины
    4: { year: 7.49, pass: 3.49, month: null },     // Индия, Индонезия, Турция
  },
  // только страны, названные в 31 §1 и §4.6; остальные — пояс 1, пока сервер не отдаст свою таблицу (T13ц)
  countries: { MX: 2, PL: 2, CL: 2, BR: 3, KZ: 3, PH: 3, IN: 4, ID: 4, TR: 4 },
  noPay: ['RU', 'BY'],          // оплата не принимается: вместо тарифов — «Стать партнёром» (31 §4.5 nopay)
};
