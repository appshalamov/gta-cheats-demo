// Вкладка «Карта»: реальные места GTA 6 (Майами / Флорида) и GTA 5 (Лос-Анджелес).
// MapLibre GL (vendor/maplibre) грузится лениво при первом открытии вкладки.
// Подложка — OpenFreeMap (векторная, OpenStreetMap, без ключа). Точки — GeoJSON-слои кружков.
// Данные: data/map/<game>.json (места + пасхалки), data/map/gtadb_<game>.json (слой сообщества).
// Интерфейс карточек — «картинки и значки прежде слов»: пара фото «в игре / в реальности»,
// пиктограммы типа места, доступа и точности совпадения, короткие подписи на языке устройства.
// Свои клики обрабатываем здесь через атрибут data-mp (app.js их не трогает).

import { t, L as tr, getLang } from './i18n.js';

const COLORS = { confirmed: '#22c3d9', likely: '#f5b942', speculative: '#9a8cab', egg: '#f472b6', gtadb: '#8b93a1' };
const GAMES = {
  gta6: { title: 'GTA 6', place: { ru: 'Vice City → Майами', en: 'Vice City → Miami' } },
  gta5: { title: 'GTA 5', place: { ru: 'Los Santos → Лос-Анджелес', en: 'Los Santos → Los Angeles' } },
};
const STYLE = { dark: 'https://tiles.openfreemap.org/styles/dark', light: 'https://tiles.openfreemap.org/styles/positron' };

// ───── короткие подписи к значкам на многих языках (остальное понимается по картинке) ─────
const W = {
  game:   { en: 'In game', ru: 'В игре', es: 'En el juego', pt: 'No jogo', fr: 'En jeu', de: 'Im Spiel', it: 'Nel gioco', tr: 'Oyunda', uk: 'У грі', pl: 'W grze', zh: '游戏中', ja: 'ゲーム内', ko: '게임 속' },
  real:   { en: 'Real life', ru: 'В жизни', es: 'En la vida real', pt: 'Na vida real', fr: 'En vrai', de: 'In echt', it: 'Dal vivo', tr: 'Gerçekte', uk: 'У житті', pl: 'W realu', zh: '现实中', ja: '実際', ko: '실제' },
  route:  { en: 'Go there', ru: 'Проложить путь', es: 'Cómo llegar', pt: 'Como chegar', fr: 'Y aller', de: 'Route', it: 'Indicazioni', tr: 'Yol tarifi', uk: 'Маршрут', pl: 'Trasa', zh: '导航', ja: '経路', ko: '길찾기' },
  look:   { en: 'Look around 360°', ru: 'Осмотреться 360°', es: 'Ver en 360°', pt: 'Ver em 360°', fr: 'Voir à 360°', de: '360°-Ansicht', it: 'Vista a 360°', tr: '360° bak', uk: 'Огляд 360°', pl: 'Widok 360°', zh: '360° 街景', ja: '360°で見る', ko: '360° 둘러보기' },
  share:  { en: 'Share', ru: 'Поделиться', es: 'Compartir', pt: 'Compartilhar', fr: 'Partager', de: 'Teilen', it: 'Condividi', tr: 'Paylaş', uk: 'Поділитися', pl: 'Udostępnij', zh: '分享', ja: '共有', ko: '공유' },
  here:   { en: 'Several places here', ru: 'Здесь несколько мест', es: 'Varios lugares aquí', pt: 'Vários lugares aqui', fr: 'Plusieurs lieux ici', de: 'Mehrere Orte hier', it: 'Più luoghi qui', tr: 'Burada birkaç yer', uk: 'Тут кілька місць', pl: 'Kilka miejsc tutaj', zh: '这里有多个地点', ja: 'ここに複数の場所', ko: '여기에 여러 장소' },
  also:   { en: 'Also here', ru: 'Здесь же', es: 'También aquí', pt: 'Também aqui', fr: 'Aussi ici', de: 'Auch hier', it: 'Anche qui', tr: 'Burada ayrıca', uk: 'Тут же', pl: 'Także tutaj', zh: '这里还有', ja: 'ここにも', ko: '여기도' },
  nearby: { en: 'Nearby', ru: 'Рядом', es: 'Cerca', pt: 'Perto', fr: 'À proximité', de: 'In der Nähe', it: 'Nelle vicinanze', tr: 'Yakında', uk: 'Поруч', pl: 'W pobliżu', zh: '附近', ja: '近く', ko: '근처' },
  full:   { en: 'Full screen', ru: 'На весь экран', es: 'Pantalla completa', pt: 'Tela cheia', fr: 'Plein écran', de: 'Vollbild', it: 'Schermo intero', tr: 'Tam ekran', uk: 'На весь екран', pl: 'Pełny ekran', zh: '全屏', ja: '全画面', ko: '전체 화면' },
  allPhotos: { en: 'All photos', ru: 'Все фото', es: 'Todas las fotos', pt: 'Todas as fotos', fr: 'Toutes les photos', de: 'Alle Fotos', it: 'Tutte le foto', tr: 'Tüm fotoğraflar', uk: 'Усі фото', pl: 'Wszystkie zdjęcia', zh: '全部照片', ja: 'すべての写真', ko: '모든 사진' },
  fav:    { en: 'Favorite', ru: 'В избранное', es: 'Favorito', pt: 'Favorito', fr: 'Favori', de: 'Favorit', it: 'Preferito', tr: 'Favori', uk: 'В обране', pl: 'Ulubione', zh: '收藏', ja: 'お気に入り', ko: '즐겨찾기' },
  compare: { en: 'Compare', ru: 'Сравнить', es: 'Comparar', pt: 'Comparar', fr: 'Comparer', de: 'Vergleichen', it: 'Confronta', tr: 'Karşılaştır', uk: 'Порівняти', pl: 'Porównaj', zh: '对比', ja: '比較', ko: '비교' },
  copied: { en: 'Link copied', ru: 'Ссылка скопирована', es: 'Enlace copiado', pt: 'Link copiado', fr: 'Lien copié', de: 'Link kopiert', it: 'Link copiato', tr: 'Bağlantı kopyalandı', uk: 'Посилання скопійовано', pl: 'Skopiowano link', zh: '链接已复制', ja: 'リンクをコピーしました', ko: '링크 복사됨' },
  trans:  { en: 'Translate', ru: 'Перевести', es: 'Traducir', pt: 'Traduzir', fr: 'Traduire', de: 'Übersetzen', it: 'Traduci', tr: 'Çevir', uk: 'Перекласти', pl: 'Przetłumacz', zh: '翻译', ja: '翻訳', ko: '번역' },
  why:    { en: 'Why it matches', ru: 'Почему похоже', es: 'Por qué coincide', pt: 'Por que combina', fr: 'Pourquoi', de: 'Warum', it: 'Perché', tr: 'Neden', uk: 'Чому схоже', pl: 'Dlaczego', zh: '为何相似', ja: '似ている理由', ko: '닮은 이유' },
  tip:    { en: 'Visit tip', ru: 'Совет', es: 'Consejo', pt: 'Dica', fr: 'Conseil', de: 'Tipp', it: 'Consiglio', tr: 'İpucu', uk: 'Порада', pl: 'Wskazówka', zh: '提示', ja: 'ヒント', ko: '팁' },
  fun:    { en: 'Fun fact', ru: 'Интересно', es: 'Dato curioso', pt: 'Curiosidade', fr: 'Le saviez-vous', de: 'Wissenswert', it: 'Curiosità', tr: 'İlginç', uk: 'Цікаво', pl: 'Ciekawostka', zh: '趣闻', ja: '豆知識', ko: '재미있는 사실' },
  seen:   { en: 'Watch in trailer', ru: 'Смотреть в трейлере', es: 'Ver en el tráiler', pt: 'Ver no trailer', fr: 'Voir la bande-annonce', de: 'Im Trailer', it: 'Nel trailer', tr: 'Fragmanda', uk: 'У трейлері', pl: 'W zwiastunie', zh: '预告片', ja: '予告編', ko: '예고편' },
  match:  { en: 'Match', ru: 'Сходство', es: 'Parecido', pt: 'Semelhança', fr: 'Ressemblance', de: 'Treffer', it: 'Somiglianza', tr: 'Benzerlik', uk: 'Схожість', pl: 'Zgodność', zh: '相似度', ja: '一致度', ko: '일치도' },
  near:   { en: 'Nearby on the map', ru: 'Рядом на карте', es: 'Cerca en el mapa', pt: 'Perto no mapa', fr: 'À proximité', de: 'In der Nähe', it: 'Nelle vicinanze', tr: 'Yakında', uk: 'Поруч на мапі', pl: 'W pobliżu', zh: '附近', ja: '近くの場所', ko: '근처 장소' },
  zoom:   { en: 'Zoom in to see places', ru: 'Приблизьте карту', es: 'Acerca el mapa', pt: 'Aproxime o mapa', fr: 'Zoomez', de: 'Hineinzoomen', it: 'Ingrandisci', tr: 'Yakınlaştırın', uk: 'Наблизьте мапу', pl: 'Przybliż mapę', zh: '放大地图', ja: '拡大してください', ko: '지도를 확대하세요' },
  src:    { en: 'Sources', ru: 'Источники', es: 'Fuentes', pt: 'Fontes', fr: 'Sources', de: 'Quellen', it: 'Fonti', tr: 'Kaynaklar', uk: 'Джерела', pl: 'Źródła', zh: '来源', ja: '出典', ko: '출처' },
  help:   { en: 'How to read the map', ru: 'Как читать карту', es: 'Cómo leer el mapa', pt: 'Como ler o mapa', fr: 'Légende', de: 'Legende', it: 'Legenda', tr: 'Harita rehberi', uk: 'Як читати мапу', pl: 'Legenda', zh: '图例', ja: '凡例', ko: '범례' },
  // точность совпадения
  confirmed: { en: 'Exact copy', ru: 'Точная копия', es: 'Copia exacta', pt: 'Cópia exata', fr: 'Copie exacte', de: 'Exakte Kopie', it: 'Copia esatta', tr: 'Birebir', uk: 'Точна копія', pl: 'Dokładna kopia', zh: '完全一致', ja: 'そっくり', ko: '똑같음' },
  likely:    { en: 'Very similar', ru: 'Очень похоже', es: 'Muy parecido', pt: 'Muito parecido', fr: 'Très proche', de: 'Sehr ähnlich', it: 'Molto simile', tr: 'Çok benzer', uk: 'Дуже схоже', pl: 'Bardzo podobne', zh: '非常相似', ja: 'よく似ている', ko: '매우 비슷함' },
  speculative: { en: 'Fan theory', ru: 'Версия фанатов', es: 'Teoría de fans', pt: 'Teoria de fãs', fr: 'Théorie de fans', de: 'Fan-Theorie', it: 'Teoria dei fan', tr: 'Hayran teorisi', uk: 'Версія фанатів', pl: 'Teoria fanów', zh: '粉丝推测', ja: 'ファン説', ko: '팬 추측' },
  // доступ
  public:   { en: 'Free to visit', ru: 'Можно свободно', es: 'Acceso libre', pt: 'Acesso livre', fr: 'Accès libre', de: 'Frei zugänglich', it: 'Accesso libero', tr: 'Serbest giriş', uk: 'Вільний вхід', pl: 'Wstęp wolny', zh: '免费参观', ja: '自由に見学', ko: '자유 방문' },
  business: { en: 'Open to guests', ru: 'Для гостей', es: 'Para clientes', pt: 'Para clientes', fr: 'Pour les clients', de: 'Für Gäste', it: 'Per clienti', tr: 'Misafirlere açık', uk: 'Для гостей', pl: 'Dla gości', zh: '对顾客开放', ja: '利用客向け', ko: '손님 이용' },
  view_from_street: { en: 'View from street', ru: 'Смотреть с улицы', es: 'Ver desde la calle', pt: 'Ver da rua', fr: 'Voir depuis la rue', de: 'Nur von außen', it: 'Solo dall’esterno', tr: 'Dışarıdan bakın', uk: 'Дивитися з вулиці', pl: 'Z ulicy', zh: '仅外观', ja: '外から見る', ko: '밖에서 보기' },
  restricted: { en: 'No entry', ru: 'Вход закрыт', es: 'Prohibido el paso', pt: 'Entrada proibida', fr: 'Accès interdit', de: 'Kein Zutritt', it: 'Vietato l’accesso', tr: 'Giriş yok', uk: 'Вхід заборонено', pl: 'Zakaz wstępu', zh: '禁止入内', ja: '立入禁止', ko: '출입 금지' },
  gone: { en: 'Closed / gone', ru: 'Закрыто / снесено', es: 'Cerrado', pt: 'Fechado', fr: 'Fermé', de: 'Geschlossen', it: 'Chiuso', tr: 'Kapalı', uk: 'Закрито', pl: 'Zamknięte', zh: '已关闭', ja: '閉鎖', ko: '폐쇄됨' },
  // тип места
  landmark: { en: 'Landmark', ru: 'Символ места', es: 'Monumento', pt: 'Marco', fr: 'Monument', de: 'Wahrzeichen', it: 'Monumento', tr: 'Simge', uk: 'Пам’ятка', pl: 'Symbol', zh: '地标', ja: 'ランドマーク', ko: '랜드마크' },
  building: { en: 'Building', ru: 'Здание', es: 'Edificio', pt: 'Prédio', fr: 'Bâtiment', de: 'Gebäude', it: 'Edificio', tr: 'Bina', uk: 'Будівля', pl: 'Budynek', zh: '建筑', ja: '建物', ko: '건물' },
  hotel: { en: 'Hotel', ru: 'Отель', es: 'Hotel', pt: 'Hotel', fr: 'Hôtel', de: 'Hotel', it: 'Hotel', tr: 'Otel', uk: 'Готель', pl: 'Hotel', zh: '酒店', ja: 'ホテル', ko: '호텔' },
  beach: { en: 'Beach', ru: 'Пляж', es: 'Playa', pt: 'Praia', fr: 'Plage', de: 'Strand', it: 'Spiaggia', tr: 'Plaj', uk: 'Пляж', pl: 'Plaża', zh: '海滩', ja: 'ビーチ', ko: '해변' },
  street: { en: 'Street', ru: 'Улица', es: 'Calle', pt: 'Rua', fr: 'Rue', de: 'Straße', it: 'Strada', tr: 'Cadde', uk: 'Вулиця', pl: 'Ulica', zh: '街道', ja: '通り', ko: '거리' },
  bridge: { en: 'Bridge', ru: 'Мост', es: 'Puente', pt: 'Ponte', fr: 'Pont', de: 'Brücke', it: 'Ponte', tr: 'Köprü', uk: 'Міст', pl: 'Most', zh: '桥', ja: '橋', ko: '다리' },
  park: { en: 'Park', ru: 'Парк', es: 'Parque', pt: 'Parque', fr: 'Parc', de: 'Park', it: 'Parco', tr: 'Park', uk: 'Парк', pl: 'Park', zh: '公园', ja: '公園', ko: '공원' },
  nature: { en: 'Nature', ru: 'Природа', es: 'Naturaleza', pt: 'Natureza', fr: 'Nature', de: 'Natur', it: 'Natura', tr: 'Doğa', uk: 'Природа', pl: 'Przyroda', zh: '自然', ja: '自然', ko: '자연' },
  business_c: { en: 'Shop / bar', ru: 'Заведение', es: 'Local', pt: 'Loja / bar', fr: 'Commerce', de: 'Lokal', it: 'Locale', tr: 'Mekân', uk: 'Заклад', pl: 'Lokal', zh: '商店', ja: '店', ko: '가게' },
  neighborhood: { en: 'District', ru: 'Район', es: 'Barrio', pt: 'Bairro', fr: 'Quartier', de: 'Viertel', it: 'Quartiere', tr: 'Semt', uk: 'Район', pl: 'Dzielnica', zh: '街区', ja: '地区', ko: '동네' },
  venue: { en: 'Venue', ru: 'Площадка', es: 'Recinto', pt: 'Arena', fr: 'Salle', de: 'Arena', it: 'Arena', tr: 'Mekân', uk: 'Арена', pl: 'Arena', zh: '场馆', ja: '会場', ko: '경기장' },
  infrastructure: { en: 'Port / road', ru: 'Порт / дорога', es: 'Puerto / vía', pt: 'Porto / via', fr: 'Port / route', de: 'Hafen / Straße', it: 'Porto / strada', tr: 'Liman / yol', uk: 'Порт / дорога', pl: 'Port / droga', zh: '港口/道路', ja: '港・道路', ko: '항구/도로' },
  sign: { en: 'Sign', ru: 'Вывеска', es: 'Letrero', pt: 'Placa', fr: 'Enseigne', de: 'Schild', it: 'Insegna', tr: 'Tabela', uk: 'Вивіска', pl: 'Znak', zh: '招牌', ja: '看板', ko: '간판' },
  other: { en: 'Place', ru: 'Место', es: 'Lugar', pt: 'Lugar', fr: 'Lieu', de: 'Ort', it: 'Luogo', tr: 'Yer', uk: 'Місце', pl: 'Miejsce', zh: '地点', ja: '場所', ko: '장소' },
  egg: { en: 'Easter egg', ru: 'Пасхалка', es: 'Easter egg', pt: 'Easter egg', fr: 'Easter egg', de: 'Easter Egg', it: 'Easter egg', tr: 'Sürpriz', uk: 'Пасхалка', pl: 'Easter egg', zh: '彩蛋', ja: 'イースターエッグ', ko: '이스터에그' },
};
const devLang = () => (navigator.language || 'en').slice(0, 2).toLowerCase();
function uiLang() {
  if (getLang() === 'ru') return 'ru';
  const d = devLang();
  return W.game[d] ? d : 'en';
}
const w = (k) => (W[k] && (W[k][uiLang()] || W[k].en)) || k;

// ───── значки (SVG, stroke = currentColor) ─────
const sv = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  game: sv('<path d="M6 9h4M8 7v4M15 10h.01M18 8h.01"/><path d="M7.5 4h9A5.5 5.5 0 0 1 22 9.5v3.8a3.7 3.7 0 0 1-6.6 2.3L14 14h-4l-1.4 1.6A3.7 3.7 0 0 1 2 13.3V9.5A5.5 5.5 0 0 1 7.5 4z"/>'),
  camera: sv('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
  pin: sv('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  nav: sv('<path d="M3 11.5 21 3l-8.5 18-2-7.5z"/>'),
  grid: sv('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  chevL: sv('<path d="m15 5-7 7 7 7"/>'),
  expand: sv('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  chevR: sv('<path d="m9 5 7 7-7 7"/>'),
  pano: sv('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'),
  heart: sv('<path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.9 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.4 0 5.7 3.3 4.5 6.7-1.7 4.7-9.2 9.3-9.2 9.3z"/>'),
  share: sv('<path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
  translate: sv('<path d="M4 5h9M8.5 3v2M6 5c.8 3 3 5.5 6 7M11 5c-.7 3.5-3.3 6.5-7 8"/><path d="m13 21 4-9 4 9M14.5 18h5"/>'),
  play: sv('<path fill="currentColor" stroke="none" d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/>'),
  close: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  swap: sv('<path d="M7 7h11l-3-3M17 17H6l3 3"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
  bulb: sv('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>'),
  spark: sv('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17.5v.01"/>'),
  egg: sv('<path d="M12 3c3.5 0 7 6 7 10.5A7 7 0 0 1 5 13.5C5 9 8.5 3 12 3z"/><path d="m7 13 2.5-2 2.5 2 2.5-2L17 13"/>'),
  // доступ
  public: sv('<circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M10 9.5l3-1.5 2.5 3 2.5 1M11.5 14.5l1-5-3.5 1.5-1.5 3"/>'),
  business: sv('<path d="M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-5h6v5"/>'),
  view_from_street: sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  restricted: sv('<circle cx="12" cy="12" r="9"/><path d="M7 12h10"/>'),
  gone: sv('<path d="M3 21h18M5 21V10l4-3 4 3v11M13 21v-6l3-2 3 2v6"/><path d="m3 3 18 18"/>'),
  // типы
  landmark: sv('<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>'),
  building: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/>'),
  hotel: sv('<path d="M3 20V8M21 20v-6a3 3 0 0 0-3-3H10v9M3 16h18"/><circle cx="6.5" cy="12" r="1.8"/>'),
  beach: sv('<path d="M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2.5-1.5 4.5-1.5S19 20 21 20"/><path d="M12 17 8 7M4 9a8 8 0 0 1 14-3z"/>'),
  street: sv('<path d="M8 3 5 21M16 3l3 18M12 4v2M12 10v3M12 17v3"/>'),
  bridge: sv('<path d="M2 17h20M4 17v-4M20 17v-4M2 13h20M6 13a6 6 0 0 1 12 0"/>'),
  park: sv('<path d="M12 21v-6M7 15h10l-5-11z"/>'),
  nature: sv('<path d="m3 20 6-10 4 6 2-3 6 7z"/><circle cx="17" cy="6" r="2"/>'),
  business_c: sv('<path d="M5 4h14l1 5H4zM5 9v11h14V9M10 20v-5h4v5"/>'),
  neighborhood: sv('<path d="M3 21V11l5-4 5 4v10M13 21V8l4-3 4 3v13M6 21v-4h4v4"/>'),
  venue: sv('<ellipse cx="12" cy="10" rx="9" ry="4"/><path d="M3 10v5c0 2.2 4 4 9 4s9-1.8 9-4v-5"/>'),
  infrastructure: sv('<path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6"/>'),
  sign: sv('<path d="M12 21V4M5 6h12l2 2.5L17 11H5z"/>'),
  other: sv('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
};
const HOTEL_RE = /hotel|motel|resort|inn\b|отел/i;
function catKey(p) {
  if ((p.c === 'building' || p.c === 'business') && HOTEL_RE.test(`${p.n} ${p.g}`)) return 'hotel';
  if (p.c === 'business') return 'business_c';
  return IC[p.c] ? p.c : 'other';
}

let ctx = null;          // {openSheet, haptic, toast, I}
let map = null, game = null, styleKey = null;
const data = {}, gtadb = {};
const show = { places: true, eggs: true, gtadb: true };   // «все точки» видны при приближении (minzoom)
let me = null;            // последняя известная позиция пользователя [lat, lon]
let selected = null;      // индекс выбранного места
let selectedD = null;     // индекс выбранной точки сообщества (gtadb)
let viewer = null;        // {p, k}

// одновременные вызовы ждут одну загрузку; после ошибки — можно повторить
const pending = {};
function once(key, make) {
  return (pending[key] ||= make().catch((err) => { delete pending[key]; throw err; }));
}
function loadLib() {
  if (window.maplibregl) return Promise.resolve();
  return once('lib', () => new Promise((ok, fail) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'vendor/maplibre/maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'vendor/maplibre/maplibre-gl.js'; s.onload = ok;
    s.onerror = () => { s.remove(); css.remove(); fail(new Error('maplibre')); }; document.head.appendChild(s);
  }));
}
async function loadGame(g) {
  if (!data[g]) data[g] = await once('d:' + g, () => fetch(`data/map/${g}.json`).then((r) => r.json()));
  return data[g];
}
async function loadGtadb(g) {
  if (!gtadb[g]) gtadb[g] = await once('g:' + g, () => fetch(`data/map/gtadb_${g}.json`).then((r) => r.json()));
  return gtadb[g];
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const mapsLink = (lat, lon, q) => isIOS()
  ? `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodeURIComponent(q || `${lat},${lon}`)}`
  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
const themeKey = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
const txt = (o) => (o ? tr(o) : '');

function km(a, b) {
  const R = 6371, r = Math.PI / 180;
  const x = Math.sin((b[0] - a[0]) * r / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin((b[1] - a[1]) * r / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function distLabel(p) {
  if (!me) return '';
  return fmtKm(km(me, [p.lat, p.lon]));
}
function fmtKm(d) {
  if (navigator.language === 'en-US') { const mi = d * 0.621; return mi < 0.2 ? `${Math.round(mi * 5280 / 10) * 10} ft` : `${mi.toFixed(mi < 10 ? 1 : 0)} mi`; }
  return d < 1 ? `${Math.round(d * 1000 / 10) * 10} m` : `${d.toFixed(d < 10 ? 1 : 0)} km`;
}
function meter(cf) {
  const n = cf === 'confirmed' ? 3 : cf === 'likely' ? 2 : 1;
  return `<span class="mp-meter" style="--c:${COLORS[cf] || COLORS.likely}">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}
function ytLink(ref) {
  const m = /(Trailer\s*1|Trailer\s*2|Extended\s*Look)\D{0,12}(\d{1,2}):(\d{2})/i.exec(ref || '');
  if (!m) return null;
  const id = /trailer\s*1/i.test(m[1]) ? 'QdBZY2fkU-0' : /trailer\s*2/i.test(m[1]) ? 'VQRLujxTm3c' : 'tJbzMqJGH4k';
  return { url: `https://www.youtube.com/watch?v=${id}&t=${(+m[2]) * 60 + (+m[3])}s`, label: `${/1/.test(m[1]) && /trailer/i.test(m[1]) ? 'Trailer 1' : /trailer/i.test(m[1]) ? 'Trailer 2' : 'Extended Look'} · ${m[2]}:${m[3]}` };
}
// кнопка «Перевести» — если текст не на языке устройства (часть советов пока только по-русски)
function needsTranslate(text) {
  if (!text || !text.trim()) return false;
  const cyr = /[а-яё]/i.test(text), dl = devLang();
  if (dl === 'ru') return !cyr;
  if (dl === 'en') return cyr;
  return true;
}
// ряд действий: главная кнопка «Осмотреться 360°» (Street View — место видно из любой страны), маленькие «маршрут» и «поделиться»
// view {pano, heading, pitch, fov, lat, lon} — проверенный вид (данные/виды_360.json); без него Google берёт ближайшую панораму и смотрит куда попало
const panoLink = (lat, lon, v) => {
  let u = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${v?.lat ?? lat},${v?.lon ?? lon}`;
  if (v?.pano) u += `&pano=${encodeURIComponent(v.pano)}`;
  for (const k of ['heading', 'pitch', 'fov']) if (Number.isFinite(v?.[k])) u += `&${k}=${v[k]}`;
  return u;
};
const favKey = (kind, id) => `${kind}:${game}:${id}`;
function favBtn(kind, id, small = false) {
  if (!ctx?.toggleFav || !id) return '';
  const on = !!ctx.isFav?.(favKey(kind, id));
  return `<button class="mp-ib mp-fav${on ? ' on' : ''}${small ? ' sm' : ''}" data-mp="fav" data-kind="${kind}" data-id="${esc(id)}" aria-label="${esc(w('fav'))}" aria-pressed="${on}" title="${esc(w('fav'))}">${IC.heart}</button>`;
}
function actions(lat, lon, name, shareText, fav = '', view = null) {
  return `<div class="mp-acts">
    <a class="mp-cta" href="${panoLink(lat, lon, view)}" target="_blank" rel="noopener">${IC.pano}<span>${esc(w('look'))}</span></a>
    <a class="mp-ib" href="${mapsLink(lat, lon, name)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}" title="${esc(w('route'))}">${IC.nav}</a>
    ${fav}<button class="mp-ib" data-mp="share" data-t="${esc(shareText)}" aria-label="${esc(w('share'))}" title="${esc(w('share'))}">${IC.share}</button>
  </div>`;
}
async function sharePlace(text) {
  const url = location.href.split('#')[0];
  try { if (navigator.share) { await navigator.share({ title: text, text, url }); return; } } catch { return; }
  try { await navigator.clipboard.writeText(`${text}\n${url}`); ctx?.toast?.(w('copied')); } catch { }
}
function translateLink(text) {
  const tl = devLang();
  return `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(tl)}&text=${encodeURIComponent(text.slice(0, 1800))}&op=translate`;
}

// ───── галереи «в игре» и «в жизни»: стрелки ‹ ›, счётчик, свайп, миниатюры; фото игроков и лайки ─────
const galleries = {};   // 'g:p12' | 'r:p12' | 'g:e3' | 'r:d5' → [{id, src, url, thumb, credit, likes, liked}]
const galNames = {};    // 'p12' → {g: имя в игре, r: имя в жизни}
const placeKey = (p) => `${game}:${p.id}`;
function asItem(ph) {
  const url = ph.url || ph.file;
  return { url, thumb: ph.thumb || url, credit: ph.credit || '' };
}
const gameList = (o) => [o.pg, ...(o.gg || [])].filter(Boolean).map((ph) => asItem(ph));
const realList = (o) => [o.pr, ...(o.gl || [])].filter(Boolean).map((ph) => asItem(ph));
const pairsOf = {};     // key → [{g, r}] — только пары с одного ракурса (подобраны людьми в gtadb)
function heroBox(key, pairs, gl, rl, names, o = {}) {
  galNames[key] = names; galleries[`g:${key}`] = gl; galleries[`r:${key}`] = rl;
  pairsOf[key] = (pairs || []).map((x) => ({ g: asItem(x.g), r: asItem(x.r) }));
  const P = pairsOf[key];
  const all = gl.length + rl.length > 2
    ? `<button class="mp-allbtn" data-mp="all" data-key="${key}">${IC.grid}<span>${esc(w('allPhotos'))}</span><em>${IC.camera}${rl.length}</em><em>${IC.game}${gl.length}</em></button>`
    : '';
  if (P.length) {
    inl[key] = { pi: 0, x: 50 };
    hintInline();
    return `<div class="mp-media-box" data-key="${key}">
      <div class="cmp-stage cmp-inline" data-key="${key}" data-i="${o.i ?? ''}" style="--x:50%" role="slider" tabindex="0" aria-label="${esc(w('compare'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
        <img class="cmp-g" src="${esc(P[0].g.url)}" alt="${esc(w('game'))}" draggable="false" decoding="async">
        <img class="cmp-r" src="${esc(P[0].r.url)}" alt="${esc(w('real'))}" draggable="false" decoding="async">
        <span class="cmp-lab g">${IC.game}<b>${esc(w('game'))}</b></span>
        <span class="cmp-lab r">${IC.camera}<b>${esc(w('real'))}</b></span>
        <div class="cmp-line"><span class="cmp-knob">${IC.chevL}${IC.chevR}</span></div>
        <button class="cmp-full" data-mp="compare" data-key="${key}" data-i="${o.i ?? ''}" aria-label="${esc(w('full'))}" title="${esc(w('full'))}">${IC.expand}</button>
      </div>
      ${P.length > 1 ? `<div class="cmp-ipairs">${P.map((x, k) => `<button class="${k ? '' : 'on'}" data-mp="ipair" data-key="${key}" data-n="${k}" aria-label="${k + 1}/${P.length}"><img src="${esc(x.g.url)}" alt="" loading="lazy"><img src="${esc(x.r.url)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      ${all}</div>`;
  }
  const cov = [gl[0], rl[0]];
  const tile = (ph, kind) => {
    const icon = kind === 'g' ? IC.game : IC.camera, label = w(kind === 'g' ? 'game' : 'real');
    if (!ph) return `<div class="mp-shot empty ${kind}"><span class="mp-shot-ic">${icon}</span></div>`;
    const act = `data-mp="view" data-ref="${kind}:${key}" data-n="0" data-i="${o.i ?? ''}"`;
    return `<button class="mp-shot ${kind}" ${act} aria-label="${esc(label)}"><img src="${esc(ph.url)}" alt="${esc(label)}" loading="lazy" decoding="async"><span class="mp-badge">${icon}<b>${esc(label)}</b></span></button>`;
  };
  const mid = `<span class="mp-vs">${o.egg ? IC.egg : IC.swap}</span>`;
  return `<div class="mp-media-box" data-key="${key}"><div class="mp-hero">${tile(cov[0], 'g')}${tile(cov[1], 'r')}${mid}</div>${all}</div>`;
}
// ───── карточки (шторка) ─────
function placeSheet(p, i) {
  const ck = catKey(p);
  const dist = distLabel(p);
  const media = (p.m || []).map(ytLink).filter(Boolean);
  return `
    ${heroBox('p' + i, p.pairs, gameList(p), realList(p), { g: p.g, r: p.n })}
    <div class="mp-names">
      <div class="mp-nm g"><span class="mp-nic">${IC.game}</span><div><b>${esc(p.g)}</b>${p.r ? `<small>${esc(p.r)}</small>` : ''}</div></div>
      <div class="mp-nm r"><span class="mp-nic">${IC.pin}</span><div><b>${esc(p.n)}</b>${p.a ? `<small>${esc(p.a)}</small>` : ''}</div></div>
    </div>
    <div class="mp-picto">
      <span class="mp-pic">${IC[ck]}<small>${esc(w(ck))}</small></span>
      ${p.ac && IC[p.ac] ? `<span class="mp-pic ac-${p.ac}">${IC[p.ac]}<small>${esc(w(p.ac))}</small></span>` : ''}
      <span class="mp-pic">${meter(p.cf)}<small>${esc(w(p.cf || 'likely'))}</small></span>
      ${dist ? `<span class="mp-pic">${IC.pin}<small>${dist}</small></span>` : ''}
    </div>
    ${actions(p.lat, p.lon, p.n, `${p.g} → ${p.n}`, favBtn('place', p.id), p.view)}
    ${(p.eggs || []).map((e) => { const yt = (e.m || []).map(ytLink).filter(Boolean)[0]; return `<div class="mp-eggblk">${favBtn('egg', e.id, true)}<span class="mp-eggic">${IC.egg}</span><div><small>${esc(w('egg'))}</small><b>${esc(txt(e.t))}</b><p>${esc(txt(e.d))}</p>${yt ? `<a href="${yt.url}" target="_blank" rel="noopener">${IC.play}<span>${esc(yt.label)}</span></a>` : ''}</div></div>`; }).join('')}
    ${(p.alias || []).length ? `<p class="mp-alias">${IC.game}<span>${esc(w('also'))}: ${p.alias.map(esc).join(' · ')}</span></p>` : ''}
    ${txt(p.s) ? `<p class="mp-text">${esc(txt(p.s))}</p>` : ''}
    ${txt(p.why) ? `<div class="mp-blk">${IC.info}<div><b>${esc(w('why'))}</b><p>${esc(txt(p.why))}</p></div></div>` : ''}
    ${txt(p.tip) ? `<div class="mp-blk">${IC.bulb}<div><b>${esc(w('tip'))}</b><p>${esc(txt(p.tip))}</p></div></div>` : ''}
    ${txt(p.fun) ? `<div class="mp-blk">${IC.spark}<div><b>${esc(w('fun'))}</b><p>${esc(txt(p.fun))}</p></div></div>` : ''}
    ${media.length ? `<div class="mp-yt">${media.map((m) => `<a href="${m.url}" target="_blank" rel="noopener">${IC.play}<span>${esc(m.label)}</span></a>`).join('')}</div>` : ''}
    ${nearbyRow(p, i)}
    ${(p.src || []).length ? `<div class="mp-src">${IC.link}${p.src.slice(0, 3).map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</a>`).join('')}</div>` : ''}
    <p class="mp-cred">${[p.pg, p.pr].filter(Boolean).map((x) => esc(x.credit)).join(' · ')}</p>`;
}
// ближайшие места (до 5 км) — следующий шаг прогулки в одно касание
function nearbyRow(p, i) {
  const all = data[game].places;
  const near = all.map((q, k) => [k, km([p.lat, p.lon], [q.lat, q.lon])]).filter(([k, d]) => k !== i && d <= 5)
    .sort((a, b) => a[1] - b[1]).slice(0, 8);
  if (!near.length) return '';
  const pic = (q) => q.pr?.thumb || q.pg?.thumb || q.pr?.file || q.pg?.file || q.pairs?.[0]?.r?.url || '';
  return `<div class="mp-near"><b class="mp-near-t">${IC.pin}<span>${esc(w('nearby'))}</span></b><div class="mp-near-row">${near.map(([k, d]) => {
    const q = all[k], img = pic(q);
    return `<button class="mp-near-c" data-mp="near" data-i="${k}">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<span class="mp-ch-ic">${IC.pin}</span>`}<span><b>${esc(q.g || q.n)}</b><small>${esc(fmtKm(d))} · ${esc(q.n)}</small></span></button>`;
  }).join('')}</div></div>`;
}
function eggSheet(e, i) {
  const yt = (e.m || []).map(ytLink).filter(Boolean);
  const cta = yt.length
    ? `<a class="mp-cta mp-cta-yt" href="${yt[0].url}" target="_blank" rel="noopener">${IC.play}<span>${esc(w('seen'))} · ${esc(yt[0].label.split(' · ')[1] || '')}</span></a>`
    : `<a class="mp-cta" href="${panoLink(e.lat, e.lon, e.view)}" target="_blank" rel="noopener">${IC.pano}<span>${esc(w('look'))}</span></a>`;
  return `
    ${heroBox('e' + i, e.pairs, gameList(e), realList(e), { g: txt(e.t), r: (e.p || '').split(',')[0] }, { egg: true })}
    <div class="mp-egghead"><span class="mp-eggic">${IC.egg}</span><div><small>${esc(w('egg'))}</small><h2>${esc(txt(e.t))}</h2></div></div>
    ${e.p ? `<div class="mp-nm r"><span class="mp-nic">${IC.pin}</span><div><b>${esc(e.p.split(',')[0])}</b><small>${esc(e.p.split(',').slice(1).join(',').trim())}</small></div></div>` : ''}
    <div class="mp-picto"><span class="mp-pic">${meter(e.cf)}<small>${esc(w(e.cf || 'likely'))}</small></span>${me ? `<span class="mp-pic">${IC.pin}<small>${distLabel(e)}</small></span>` : ''}</div>
    <div class="mp-acts">${cta}
      <a class="mp-ib" href="${mapsLink(e.lat, e.lon, e.p)}" target="_blank" rel="noopener" aria-label="${esc(w('route'))}">${IC.nav}</a>
      ${favBtn('egg', e.id)}<button class="mp-ib" data-mp="share" data-t="${esc(txt(e.t))}" aria-label="${esc(w('share'))}">${IC.share}</button></div>
    <p class="mp-text">${esc(txt(e.d))}</p>
    ${yt.length > 1 ? `<div class="mp-yt">${yt.slice(1).map((m) => `<a href="${m.url}" target="_blank" rel="noopener">${IC.play}<span>${esc(m.label)}</span></a>`).join('')}</div>` : ''}
    ${e.src ? `<div class="mp-src">${IC.link}<a href="${esc(e.src)}" target="_blank" rel="noopener">${esc(String(e.src).replace(/^https?:\/\/(www\.)?/, '').split('/')[0])}</a></div>` : ''}
    <p class="mp-cred">${[e.pg, e.pr].filter(Boolean).map((x) => esc(x.credit)).join(' · ')}</p>`;
}
// фото точек сообщества — из открытого репозитория gtadb.org на GitHub (CC BY 4.0; кадры игры © Rockstar Games)
function gtadbPhotos(p, g) {
  const v = g === 'VI' ? 6 : 5, id = encodeURIComponent(p[0]);
  const u = (k) => `https://raw.githubusercontent.com/rolux/gtadb.org/main/map/photos/${v}/${id},${k}.jpg`;
  return { pg: p[7] ? { file: u('ig'), credit: '© Rockstar Games · gtadb.org' } : null, pr: p[8] ? { file: u('rl'), credit: 'gtadb.org and contributors (CC BY 4.0)' } : null };
}
function gtadbSheet(p, g, i) {
  const [id, name, district, real, lat, lon, type] = p;
  const ph = gtadbPhotos(p, g);
  return `
    ${heroBox('d' + i, ph.pg && ph.pr ? [{ g: ph.pg, r: ph.pr }] : [], gameList(ph), realList(ph), { g: name || district || id, r: real.split(',')[0] })}
    <div class="mp-names">
      <div class="mp-nm g"><span class="mp-nic">${IC.game}</span><div><b>${esc(name || district || id)}</b>${name && district ? `<small>${esc(district)}</small>` : ''}</div></div>
      <div class="mp-nm r"><span class="mp-nic">${IC.pin}</span><div><b>${esc(real.split(',')[0])}</b><small>${esc(real.split(',').slice(1).join(',').trim())}</small></div></div>
    </div>
    <div class="mp-picto"><span class="mp-pic">${IC.other}<small>${esc(type || w('other'))}</small></span>${me ? `<span class="mp-pic">${IC.pin}<small>${distLabel({ lat, lon })}</small></span>` : ''}</div>
    ${(p[9] || []).length ? `<div class="mp-also"><small>${esc(w('also'))}</small>${p[9].map((x) => `<span>${IC.game}${esc(x)}</span>`).join('')}</div>` : ''}
    ${actions(lat, lon, real, `${name || district || id} → ${real.split(',')[0]}`)}
    <div class="mp-src">${IC.link}<a href="https://map.gtadb.org/#${g},${esc(id)}" target="_blank" rel="noopener">gtadb.org</a></div>
    <p class="d-note">${t('map_gtadb_credit')}</p>`;
}
function helpSheet() {
  const row = (ic, label, extra = '') => `<div class="mp-hrow"><span class="mp-pic">${ic}</span><span>${esc(label)}</span>${extra}</div>`;
  return `<h2 class="pick-t">${esc(w('help'))}</h2>
    <div class="mp-help">
      ${row(`<i class="mp-dot" style="background:${COLORS.confirmed}"></i>`, w('confirmed'), meter('confirmed'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.likely}"></i>`, w('likely'), meter('likely'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.speculative}"></i>`, w('speculative'), meter('speculative'))}
      ${row(`<i class="mp-dot" style="background:${COLORS.egg};box-shadow:0 0 0 2px #fff"></i>`, w('egg'))}
      <hr>
      ${row(IC.game, w('game'))}${row(IC.camera, w('real'))}
      <hr>
      ${['public', 'business', 'view_from_street', 'restricted', 'gone'].map((k) => row(IC[k], w(k))).join('')}
    </div>`;
}

// ───── сравнение прямо в карточке ─────
// Пара с одного ракурса показывается сразу ползунком: палец вбок — двигает, вверх-вниз — листает карточку,
// короткое нажатие или ⤢ — на весь экран. Пока ползунок едет, шторка не тянется вниз.
const inl = {};          // key → { pi: номер пары, x: положение ползунка, % }
let cmpDrag = null;      // { st, id, x0, y0, mode: null | 'h' | 'v' }
function hintInline() {
  if (hintInline.done || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hintInline.done = true;
  requestAnimationFrame(() => {
    const st = document.querySelector('#sheet-body .cmp-inline');
    if (!st) { hintInline.done = false; return; }
    setTimeout(() => { st.classList.add('hint'); setTimeout(() => st.classList.remove('hint'), 1600); }, 350);
  });
}
function setInlineX(st, v) {
  v = Math.max(0, Math.min(100, v));
  st.style.setProperty('--x', v + '%'); st.setAttribute('aria-valuenow', String(Math.round(v)));
  (inl[st.dataset.key] ||= { pi: 0 }).x = v;
}
function setInlinePair(btn) {
  const key = btn.dataset.key, n = +btn.dataset.n, pr = (pairsOf[key] || [])[n];
  const box = btn.closest('.mp-media-box'), st = box?.querySelector('.cmp-inline');
  if (!pr || !st) return;
  st.querySelector('.cmp-g').src = pr.g.url; st.querySelector('.cmp-r').src = pr.r.url;
  box.querySelectorAll('.cmp-ipairs button').forEach((b) => b.classList.toggle('on', b === btn));
  (inl[key] ||= {}).pi = n; setInlineX(st, 50);   // новый ракурс — снова пополам
}
document.addEventListener('pointerdown', (e) => {
  const st = e.target.closest?.('.cmp-inline');
  if (!st || e.target.closest('button') || e.button > 0) return;
  cmpDrag = { st, id: e.pointerId, x0: e.clientX, y0: e.clientY, mode: null };
});
document.addEventListener('pointermove', (e) => {
  const d = cmpDrag;
  if (!d || e.pointerId !== d.id) return;
  if (!d.mode) {
    const dx = Math.abs(e.clientX - d.x0), dy = Math.abs(e.clientY - d.y0);
    if (dx > 6 && dx >= dy) {
      d.mode = 'h'; d.st.classList.remove('hint'); d.st.classList.add('drag');
      try { d.st.setPointerCapture(e.pointerId); } catch { }
      const sh = document.getElementById('sheet'); if (sh) sh.style.transform = '';
    } else if (dy > 8) d.mode = 'v';
  }
  if (d.mode === 'h') { const b = d.st.getBoundingClientRect(); setInlineX(d.st, ((e.clientX - b.left) / b.width) * 100); }
});
function endInlineDrag(e) {
  const d = cmpDrag;
  if (!d || e.pointerId !== d.id) return;
  cmpDrag = null; d.st.classList.remove('drag');
  if (d.mode || e.type !== 'pointerup') return;
  ctx?.haptic?.();                                     // короткое нажатие — на весь экран
  const s = inl[d.st.dataset.key] || {};
  if (d.st.dataset.i) viewer = { ...(viewer || {}), i: d.st.dataset.i };
  openCompare(d.st.dataset.key, s.pi || 0, s.x ?? 50);
}
document.addEventListener('pointerup', endInlineDrag);
document.addEventListener('pointercancel', endInlineDrag);
// жест вбок (ползунок, полоса «Рядом», миниатюры пар) не должен тянуть шторку: её жест — touchmove на #sheet
let hTouch = null;
addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  hTouch = e.target.closest?.('.mp-near-row, .cmp-ipairs') ? { x: t.clientX, y: t.clientY, h: null } : null;
}, { capture: true, passive: true });
addEventListener('touchmove', (e) => {
  if (cmpDrag?.mode === 'h') { e.stopPropagation(); return; }
  if (!hTouch) return;
  const t = e.touches[0];
  if (hTouch.h == null) { const dx = Math.abs(t.clientX - hTouch.x), dy = Math.abs(t.clientY - hTouch.y); if (dx > 6 || dy > 6) hTouch.h = dx > dy; }
  if (hTouch.h) e.stopPropagation();
}, { capture: true, passive: true });
addEventListener('keydown', (e) => {
  const st = e.target.closest?.('.cmp-inline');
  if (!st || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  e.preventDefault();
  setInlineX(st, (inl[st.dataset.key]?.x ?? 50) + (e.key === 'ArrowLeft' ? -5 : 5));
});

// ───── просмотр на весь экран ─────
// «Сравнить» — только пары с одного ракурса, ползунок двигается пальцем. «Все фото» — сетка всех снимков (жизнь / игра),
// отсюда же «＋ Ваше фото». Нажатие на снимок — на весь экран со стрелками и свайпом.
function viewerEl() {
  let el = document.getElementById('mp-viewer');
  if (!el) { el = document.createElement('div'); el.id = 'mp-viewer'; document.body.appendChild(el); }
  return el;
}
function vTabs(key, active) {
  const tabs = [];
  if ((pairsOf[key] || []).length) tabs.push(['compare', IC.swap, w('compare'), '']);
  tabs.push(['all', IC.grid, w('allPhotos'), (galleries[`r:${key}`] || []).length + (galleries[`g:${key}`] || []).length]);
  return `<div class="mpv-tabs">${tabs.map(([m, ic, lab, cnt]) => `<button class="${m === active ? 'on' : ''}" data-mp="${m}" data-key="${key}" data-i="${viewer?.i ?? ''}">${ic}<span>${esc(lab)}</span>${cnt ? `<em>${cnt}</em>` : ''}</button>`).join('')}</div>`;
}
function openViewer(ref, n = 0) { openSingle(ref, n); }
function openCompare(key, pi = 0, x = 50) {
  const P = pairsOf[key] || [];
  if (!P.length) return openAll(key, 'r');
  pi = (pi + P.length) % P.length;
  viewer = { mode: 'cmp', key, pi, x, i: viewer?.i };
  const names = galNames[key] || {}, pr = P[pi];
  const el = viewerEl();
  el.innerHTML = `
    <button class="mpv-x" data-mp="viewer-close" aria-label="close">${IC.close}</button>
    ${vTabs(key, 'compare')}
    <div class="cmp-stage" id="cmp-stage" style="--x:${x}%">
      <img class="cmp-g" src="${esc(pr.g.url)}" alt="" draggable="false">
      <img class="cmp-r" src="${esc(pr.r.url)}" alt="" draggable="false">
      <span class="cmp-lab g">${IC.game}<b>${esc(w('game'))}</b></span>
      <span class="cmp-lab r">${IC.camera}<b>${esc(w('real'))}</b></span>
      <div class="cmp-line"><span class="cmp-knob">${IC.chevL}${IC.chevR}</span></div>
    </div>
    <div class="mpv-cap"><b>${esc(names.g || '')} ⇄ ${esc(names.r || '')}${P.length > 1 ? ` · ${pi + 1}/${P.length}` : ''}</b></div>
    ${P.length > 1 ? `<div class="cmp-pairs">${P.map((x, k) => `<button class="${k === pi ? 'on' : ''}" data-mp="pair" data-n="${k}"><img src="${esc(x.g.url)}" alt="" loading="lazy"><img src="${esc(x.r.url)}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    <p class="mpv-credit">${esc(pr.g.credit)} · ${esc(pr.r.credit)}</p>`;
  el.classList.add('open');
  const stage = el.querySelector('#cmp-stage');
  const setX = (cx) => { const b = stage.getBoundingClientRect(); const v = Math.max(0, Math.min(100, ((cx - b.left) / b.width) * 100)); stage.style.setProperty('--x', v + '%'); viewer.x = v; };
  let drag = false;
  stage.onpointerdown = (e) => { drag = true; stage.setPointerCapture?.(e.pointerId); setX(e.clientX); };
  stage.onpointermove = (e) => { if (drag) setX(e.clientX); };
  stage.onpointerup = stage.onpointercancel = () => { drag = false; };
  if (!openCompare.hinted && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    openCompare.hinted = true;
    stage.classList.add('hint'); setTimeout(() => stage.classList.remove('hint'), 1600);
  }
}
function openAll(key, tab = 'r', i = viewer?.i) {
  viewer = { mode: 'all', key, tab, i };
  const R = galleries[`r:${key}`] || [], G = galleries[`g:${key}`] || [];
  const list = tab === 'r' ? R : G;
  const el = viewerEl();
  el.innerHTML = `
    <button class="mpv-x" data-mp="viewer-close" aria-label="close">${IC.close}</button>
    ${vTabs(key, 'all')}
    <div class="mpa-tabs">
      <button class="${tab === 'r' ? 'on' : ''}" data-mp="all-tab" data-t="r">${IC.camera}<span>${esc(w('real'))}</span><em>${R.length}</em></button>
      <button class="${tab === 'g' ? 'on' : ''}" data-mp="all-tab" data-t="g">${IC.game}<span>${esc(w('game'))}</span><em>${G.length}</em></button>
    </div>
    <div class="mpa-grid">
      ${list.map((ph, k) => `<div class="mpa-cell"><button class="mpa-img" data-mp="view" data-ref="${tab}:${key}" data-n="${k}"><img src="${esc(ph.thumb)}" alt="" loading="lazy" decoding="async"></button></div>`).join('')}
    </div>`;
  el.classList.add('open');
}
function openSingle(ref, n = 0) {
  const list = galleries[ref] || [];
  if (!list.length) return;
  n = (n + list.length) % list.length;
  const kind = ref[0], key = ref.slice(2), names = galNames[key] || {};
  viewer = { mode: 'one', ref, n, key, i: viewer?.i };
  const ph = list[n];
  const el = viewerEl();
  el.innerHTML = `
    <button class="mpv-x" data-mp="viewer-close" aria-label="close">${IC.close}</button>
    ${vTabs(key, '')}
    <div class="mpv-stage" id="mpv-stage">
      <img src="${esc(ph.url)}" alt="" draggable="false">
      ${list.length > 1 ? `<button class="mpv-arr l" data-mp="viewer-step" data-d="-1" aria-label="‹">${IC.chevL}</button><button class="mpv-arr r" data-mp="viewer-step" data-d="1" aria-label="›">${IC.chevR}</button>` : ''}
    </div>
    <div class="mpv-cap"><b>${kind === 'g' ? IC.game : IC.camera} ${esc(kind === 'g' ? names.g || '' : names.r || '')}${list.length > 1 ? ` · ${n + 1}/${list.length}` : ''}</b><small>${esc(ph.credit || '')}</small></div>`;
  el.classList.add('open');
  const stage = el.querySelector('#mpv-stage');
  let x0 = null;
  stage.onpointerdown = (e) => { x0 = e.clientX; };
  stage.onpointerup = (e) => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40 && list.length > 1) openSingle(ref, n + (dx < 0 ? 1 : -1)); };
}
function closeViewer() { document.getElementById('mp-viewer')?.classList.remove('open'); viewer = null; resetDocScroll(); }

// Страница приложения никогда не прокручивается целиком (иначе на iPhone вылезают спрятанные слои — например, экран оплаты).
// Любую прокрутку документа сразу возвращаем в ноль. Корень и проверка — tools/check_no_doc_scroll.js.
function resetDocScroll() { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); }
addEventListener('scroll', resetDocScroll, { passive: true });

// ───── лента карточек внизу карты ─────
function ensureChrome() {
  const view = document.getElementById('view-map');
  if (!document.getElementById('map-cards')) {
    const c = document.createElement('div'); c.id = 'map-cards'; c.className = 'map-cards'; view.appendChild(c);
  }
  const fabs = view.querySelector('.map-fabs');
  if (fabs && !fabs.querySelector('[data-mp="help"]')) {
    const b = document.createElement('button'); b.className = 'map-fab'; b.dataset.mp = 'help'; b.setAttribute('aria-label', 'help'); b.innerHTML = IC.help;
    fabs.prepend(b);
  }
}
function renderCards() {
  const box = document.getElementById('map-cards');
  if (!box || !map || !data[game]) return;
  const places = data[game].places;
  const b = map.getBounds(), c = map.getCenter();
  const vis = show.places ? places.map((p, i) => ({ p, i })).filter(({ p }) => b.contains([p.lon, p.lat])) : [];
  // на общем плане — сначала самые узнаваемые (точная копия, обе фотографии), при приближении — ближайшие к центру
  const rank = (p) => (p.cf === 'confirmed' ? 0 : p.cf === 'likely' ? 1 : 2) + (p.pg && p.pr ? 0 : 1.5);
  const dc = (p) => km([c.lat, c.lng], [p.lat, p.lon]);
  if (map.getZoom() < 12.5) vis.sort((a, z) => rank(a.p) - rank(z.p) || dc(a.p) - dc(z.p));
  else vis.sort((a, z) => dc(a.p) - dc(z.p));
  const top = vis.slice(0, 30);
  if (selected != null && !top.some((x) => x.i === selected)) { const s = vis.find((x) => x.i === selected); if (s) top.unshift(s); }
  let extra = '';
  if (show.gtadb && gtadb[game] && map.getZoom() >= 13 && top.length < 30) {
    const g = gtadb[game];
    const pts = g.points.map((q, i) => ({ q, i })).filter(({ q }) => b.contains([q[5], q[4]]));
    pts.sort((a, z) => km([c.lat, c.lng], [a.q[4], a.q[5]]) - km([c.lat, c.lng], [z.q[4], z.q[5]]));
    extra = pts.slice(0, 30 - top.length).map(({ q, i }) => {
      const ph = gtadbPhotos(q, g.game);
      return `<button class="mc mc-d${i === selectedD ? ' on' : ''}" data-mp="dcard" data-d="${i}" data-i="${i}">
        <span class="mc-ph">${ph.pg ? `<img src="${esc(ph.pg.file)}" alt="" loading="lazy" decoding="async">` : `<i class="g">${IC.game}</i>`}${ph.pr ? `<img src="${esc(ph.pr.file)}" alt="" loading="lazy" decoding="async">` : `<i class="r">${IC.camera}</i>`}<em>${IC.game}</em><em class="r">${IC.camera}</em></span>
        <span class="mc-t"><b>${esc(q[3].split(',')[0])}</b><small>${IC.game}${esc(q[1] || q[2] || q[0])}</small></span>
        <span class="mc-ic">${IC.other}<span class="mc-dot"></span>${me ? `<em>${distLabel({ lat: q[4], lon: q[5] })}</em>` : ''}</span>
      </button>`;
    }).join('');
  }
  if (!top.length && !extra) { box.innerHTML = `<div class="mc-empty">${IC.pin}<span>${esc(w('zoom'))}</span></div>`; return; }
  box.innerHTML = extra && !top.length ? extra : top.map(({ p, i }) => {
    const ck = catKey(p);
    return `<button class="mc${i === selected ? ' on' : ''}" data-mp="card" data-i="${i}">
      <span class="mc-ph">${p.pg ? `<img src="${esc(p.pg.thumb || p.pg.file)}" alt="" loading="lazy" decoding="async">` : `<i class="g">${IC.game}</i>`}${p.pr ? `<img src="${esc(p.pr.thumb || p.pr.file)}" alt="" loading="lazy" decoding="async">` : `<i class="r">${IC.camera}</i>`}<em>${IC.game}</em><em class="r">${IC.camera}</em></span>
      <span class="mc-t"><b>${esc(p.n)}</b><small>${IC.game}${esc(p.g)}</small></span>
      <span class="mc-ic">${IC[ck]}${p.ac && IC[p.ac] ? IC[p.ac] : ''}${meter(p.cf)}${me ? `<em>${distLabel(p)}</em>` : ''}</span>
    </button>`;
  }).join('') + (top.length ? extra : '');
}
function scrollCardIntoView(i) {
  const el = document.querySelector(`#map-cards .mc[data-i="${i}"]`);
  el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

// ───── слои ─────
const fc = (features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, props) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props });

function geo(kind) {
  const d = data[game];
  if (kind === 'places') return fc((d?.places || []).map((p, i) => pt(p.lon, p.lat, { i, cf: p.cf, egg: (p.eggs || []).length ? 1 : 0 })));
  if (kind === 'eggs') return fc((d?.eggs || []).map((e, i) => pt(e.lon, e.lat, { i, cf: e.cf })));
  if (kind === 'gtadb') return fc(show.gtadb && gtadb[game] ? gtadb[game].points.map((p, i) => pt(p[5], p[4], { i })) : []);
  if (kind === 'sel') {
    const p = selected != null && d?.places[selected];
    if (p) return fc([pt(p.lon, p.lat, {})]);
    const q = selectedD != null && gtadb[game]?.points[selectedD];
    return fc(q ? [pt(q[5], q[4], {})] : []);
  }
  return fc([]);
}

function addLayers() {
  const dark = themeKey() === 'dark';
  const stroke = dark ? '#0b0b0d' : '#ffffff';
  for (const k of ['gtadb', 'places', 'eggs', 'sel']) if (!map.getSource(k)) map.addSource(k, { type: 'geojson', data: geo(k) });
  const z = (a, b) => ['interpolate', ['linear'], ['zoom'], 8, a, 15, b];
  if (!map.getLayer('gtadb')) map.addLayer({ id: 'gtadb', type: 'circle', source: 'gtadb', minzoom: 11.5,
    paint: { 'circle-radius': z(2.5, 6), 'circle-color': COLORS.gtadb, 'circle-opacity': .75, 'circle-stroke-width': 1, 'circle-stroke-color': stroke } });
  if (!map.getLayer('places-glow')) map.addLayer({ id: 'places-glow', type: 'circle', source: 'places', filter: ['==', ['get', 'cf'], 'confirmed'],
    paint: { 'circle-radius': z(9, 18), 'circle-color': COLORS.confirmed, 'circle-opacity': .18, 'circle-blur': .6 } });
  if (!map.getLayer('places')) map.addLayer({ id: 'places', type: 'circle', source: 'places',
    paint: { 'circle-radius': z(4.5, 10), 'circle-stroke-width': 1.5, 'circle-stroke-color': stroke,
      'circle-color': ['match', ['get', 'cf'], 'confirmed', COLORS.confirmed, 'speculative', COLORS.speculative, COLORS.likely] } });
  if (!map.getLayer('places-egg')) map.addLayer({ id: 'places-egg', type: 'circle', source: 'places', filter: ['==', ['get', 'egg'], 1],
    paint: { 'circle-radius': z(7, 14), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2.2, 'circle-stroke-color': COLORS.egg } });
  if (!map.getLayer('eggs')) map.addLayer({ id: 'eggs', type: 'circle', source: 'eggs',
    paint: { 'circle-radius': z(5, 11), 'circle-color': COLORS.egg, 'circle-stroke-width': 2.2, 'circle-stroke-color': '#ffffff' } });
  if (!map.getLayer('sel')) map.addLayer({ id: 'sel', type: 'circle', source: 'sel',
    paint: { 'circle-radius': z(11, 18), 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 3, 'circle-stroke-color': dark ? '#ffffff' : '#0b0b0d' } });
  if (!map.getSource('me')) {
    map.addSource('me', { type: 'geojson', data: fc(me ? [pt(me[1], me[0], {})] : []) });
    map.addLayer({ id: 'me', type: 'circle', source: 'me', paint: { 'circle-radius': 8, 'circle-color': '#3b82f6', 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' } });
  }
  applyShow();
}
function refreshData() {
  for (const k of ['gtadb', 'places', 'eggs', 'sel']) map.getSource(k)?.setData(geo(k));
}
function applyShow() {
  const vis = (on) => (on ? 'visible' : 'none');
  if (!map.getLayer('places')) return;
  map.setLayoutProperty('gtadb', 'visibility', vis(show.gtadb));
  map.setLayoutProperty('places', 'visibility', vis(show.places));
  map.setLayoutProperty('places-glow', 'visibility', vis(show.places));
  if (map.getLayer('places-egg')) map.setLayoutProperty('places-egg', 'visibility', vis(show.places));
  map.setLayoutProperty('eggs', 'visibility', vis(show.eggs));
}

function openPlace(i, fly) {
  const p = data[game].places[i];
  selected = i; selectedD = null;
  map?.getSource('sel')?.setData(geo('sel'));
  if (fly) map.easeTo({ center: [p.lon, p.lat], zoom: Math.max(map.getZoom(), 14.5), duration: 700, offset: [0, -90] });
  renderCards(); scrollCardIntoView(i);
  ctx.openSheet(placeSheet(p, i), 'sheet-map');
}

// нажатие: ищем точку в радиусе пальца, приоритет пасхалки > места > сообщество
function onTap(e) {
  const r = 14, { x, y } = e.point;
  const layers = ['eggs', 'places', 'gtadb'].filter((l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none');
  const hits = map.queryRenderedFeatures([[x - r, y - r], [x + r, y + r]], { layers });
  if (!hits.length) return;
  const uniq = []; const seenHit = new Set();
  for (const h of hits.sort((a, b) => dist(a, e) - dist(b, e))) { const k = h.layer.id + ':' + h.properties.i; if (!seenHit.has(k)) { seenHit.add(k); uniq.push(h); } }
  if (uniq.length > 1) { ctx.haptic(); ctx.openSheet(chooserSheet(uniq.slice(0, 12)), 'sheet-map'); return; }
  const nearest = uniq[0];
  const i = nearest.properties.i, l = nearest.layer.id;
  ctx.haptic();
  if (l === 'eggs') ctx.openSheet(eggSheet(data[game].eggs[i], i), 'sheet-map');
  else if (l === 'places') openPlace(i, false);
  else openPoint(i, false);
}
function chooserSheet(hits) {
  const row = (h) => {
    const i = h.properties.i, l = h.layer.id;
    let img = '', title = '', sub = '', ic = IC.pin;
    if (l === 'places') { const p = data[game].places[i]; img = (p.pg || p.pr || {}).thumb || (p.pg || p.pr || {}).file || ''; title = p.n; sub = p.g; }
    else if (l === 'eggs') { const e = data[game].eggs[i]; img = (e.pg || e.pr || {}).thumb || (e.pg || e.pr || {}).file || ''; title = txt(e.t); sub = w('egg'); ic = IC.egg; }
    else { const q = gtadb[game].points[i]; const ph = gtadbPhotos(q, gtadb[game].game); img = (ph.pg || ph.pr || {}).file || ''; title = q[3].split(',')[0]; sub = q[1] || q[2]; }
    return `<button class="mp-ch" data-mp="pick" data-l="${l}" data-i="${i}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="mp-ch-ic">${ic}</span>`}<span><b>${esc(title)}</b><small>${IC.game}${esc(sub || '')}</small></span></button>`;
  };
  return `<h2 class="pick-t">${esc(w('here'))}</h2><div class="mp-chooser">${hits.map(row).join('')}</div>`;
}
function openPoint(i, fly) {
  const q = gtadb[game].points[i];
  selected = null; selectedD = i;
  map?.getSource('sel')?.setData(geo('sel'));
  if (fly) map.easeTo({ center: [q[5], q[4]], zoom: Math.max(map.getZoom(), 15), duration: 700, offset: [0, -90] });
  renderCards();
  document.querySelector(`#map-cards .mc[data-d="${i}"]`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  ctx.openSheet(gtadbSheet(q, gtadb[game].game, i), 'sheet-map');
}
function dist(f, e) {
  const p = map.project(f.geometry.coordinates);
  return (p.x - e.point.x) ** 2 + (p.y - e.point.y) ** 2;
}

// ───── интерфейс поверх карты ─────
function renderChips() {
  const d = data[game]; if (!d) return;
  const n = { places: d.places.length, eggs: d.eggs.length, gtadb: gtadb[game]?.points.length ?? '' };
  document.getElementById('map-chips').innerHTML = [
    ['places', t('map_places'), COLORS.confirmed], ['eggs', t('map_eggs'), COLORS.egg], ['gtadb', t('map_all'), COLORS.gtadb],
  ].map(([k, label, c]) => `<button class="mchip${show[k] ? ' on' : ''}" data-action="map-layer" data-v="${k}" style="--c:${c}"><i></i>${label}${n[k] !== '' ? ` <em>${n[k]}</em>` : ''}</button>`).join('');
  document.getElementById('map-games').innerHTML = Object.entries(GAMES).map(([id, g]) =>
    `<button class="${id === game ? 'on' : ''}" data-action="map-game" data-v="${id}"><b>${g.title}</b><small>${tr(g.place)}</small></button>`).join('');
  const lg = document.getElementById('map-legend'); if (lg) lg.innerHTML = '';
}

// свои клики (data-mp) — шторка, лента, просмотрщик
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-mp]');
  if (!el || !data[game]) return;
  const a = el.dataset.mp;
  if (a === 'card') { ctx?.haptic(); openPlace(+el.dataset.i, true); }
  else if (a === 'dcard') { ctx?.haptic(); openPoint(+el.dataset.i, true); }
  else if (a === 'view') { ctx?.haptic(); if (el.dataset.i) viewer = { ...(viewer || {}), i: el.dataset.i }; openViewer(el.dataset.ref, +(el.dataset.n || 0)); }
  else if (a === 'viewer-step') openSingle(viewer.ref, viewer.n + (+el.dataset.d));
  else if (a === 'compare') {
    ctx?.haptic(); const st = inl[el.dataset.key];
    if (el.dataset.i !== undefined && el.dataset.i !== '') viewer = { ...(viewer || {}), i: el.dataset.i };
    if (viewer?.mode === 'cmp') openCompare(el.dataset.key, viewer.pi, viewer.x ?? 50);
    else openCompare(el.dataset.key, st?.pi ?? 0, st?.x ?? 50);
  }
  else if (a === 'ipair') { ctx?.haptic(); setInlinePair(el); }
  else if (a === 'near') { ctx?.haptic(); openPlace(+el.dataset.i, true); }
  else if (a === 'pair') openCompare(viewer.key, +el.dataset.n, viewer.x ?? 50);
  else if (a === 'all') { ctx?.haptic(); openAll(el.dataset.key, viewer?.mode === 'all' ? viewer.tab : 'r', el.dataset.i !== undefined && el.dataset.i !== '' ? el.dataset.i : viewer?.i); }
  else if (a === 'all-tab') openAll(viewer.key, el.dataset.t, viewer.i);
  else if (a === 'viewer-close') closeViewer();
  else if (a === 'pick') { const i = +el.dataset.i, l = el.dataset.l; if (l === 'places') openPlace(i, false); else if (l === 'eggs') ctx.openSheet(eggSheet(data[game].eggs[i], i), 'sheet-map'); else openPoint(i, false); }
  else if (a === 'fav') {
    e.stopPropagation(); ctx?.haptic?.();
    const on = !!ctx?.toggleFav?.(favKey(el.dataset.kind, el.dataset.id), { kind: el.dataset.kind, game, id: el.dataset.id });
    el.classList.toggle('on', on); el.setAttribute('aria-pressed', String(on));
    el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 300);
  }
  else if (a === 'share') { ctx?.haptic(); sharePlace(el.dataset.t); }
  else if (a === 'help') { ctx?.haptic(); ctx.openSheet(helpSheet(), 'sheet-map'); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeViewer(); });

let opening = null;   // карта создаётся один раз: второй open() во время загрузки ждёт первый
export async function open(c, preferGame) {
  ctx = c;
  ensureChrome();
  if (map) retheme();
  else await (opening ||= create(preferGame).finally(() => { opening = null; }));
  requestAnimationFrame(() => map?.resize());
}

async function create(preferGame) {
  const box = document.getElementById('map');
  box.classList.add('loading');
  try {
    game = preferGame === 'gta5' ? 'gta5' : 'gta6';
    const [d] = await Promise.all([loadGame(game), loadLib(), loadGtadb(game).catch(() => null)]);
    styleKey = themeKey();
    map = new window.maplibregl.Map({
      container: box, style: STYLE[styleKey], center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6,
      attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false, fadeDuration: 150,
    });
    map.touchZoomRotate.disableRotation();
    window.__gtaMap = map; // для проверки из консоли (?vptest и т. п.)
    map.on('style.load', addLayers);
    map.on('load', () => { box.classList.remove('loading'); renderCards(); });
    map.on('moveend', renderCards);
    map.on('click', onTap);
    renderChips();
  } catch (err) {
    box.classList.remove('loading');
    throw err;
  }
}

export async function setGame(g) {
  if (!map || g === game) return;
  game = g; selected = null; selectedD = null;
  const d = await loadGame(g);
  if (show.gtadb) await loadGtadb(g);
  refreshData(); renderChips();
  map.flyTo({ center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6, duration: 1100, essential: true });
}

export async function toggle(k) {
  show[k] = !show[k];
  if (k === 'gtadb' && show[k]) { await loadGtadb(game); refreshData(); }
  applyShow(); renderChips(); renderCards();
}

export async function focus(g, kind, id) {
  if (!map && opening) await opening.catch(() => null);
  if (!map) return false;
  if (g && g !== game) await setGame(g);
  const d = await loadGame(game);
  if (kind === 'place') {
    const i = d.places.findIndex((x) => x.id === id);
    if (i < 0) return false;
    openPlace(i, true); return true;
  }
  const ei = d.eggs.findIndex((x) => x.id === id);
  if (ei >= 0) {
    const e = d.eggs[ei];
    map.easeTo({ center: [e.lon, e.lat], zoom: Math.max(map.getZoom(), 15), duration: 700, offset: [0, -90] });
    ctx.openSheet(eggSheet(e, ei), 'sheet-map'); return true;
  }
  const pi = d.places.findIndex((x) => (x.eggs || []).some((e) => e.id === id));   // пасхалка показана в карточке места
  if (pi < 0) return false;
  openPlace(pi, true);
  setTimeout(() => document.querySelector(`#sheet-body [data-mp="fav"][data-id="${CSS.escape(id)}"]`)?.closest('.mp-eggblk')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 450);
  return true;
}

export function locate() {
  if (!map || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((pos) => {
    me = [pos.coords.latitude, pos.coords.longitude];
    map.getSource('me')?.setData(fc([pt(me[1], me[0], {})]));
    map.flyTo({ center: [me[1], me[0]], zoom: 13, duration: 1000 });
  }, () => ctx?.toast?.(t('map_no_geo')), { enableHighAccuracy: true, timeout: 8000 });
}

export function refit() {
  const d = data[game]; if (map && d) map.flyTo({ center: [d.center[1], d.center[0]], zoom: d.zoom - 0.6, duration: 800 });
}

export function retheme() {
  if (!map) return;
  const k = themeKey();
  if (k !== styleKey) { styleKey = k; map.setStyle(STYLE[k]); } // style.load → addLayers
}
export function relang() { if (map) { renderChips(); renderCards(); } }
