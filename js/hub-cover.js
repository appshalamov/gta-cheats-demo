// Обложка хаба — «Прохождение», «Не упустить навсегда» (сохранения), «Концовки» (решение Fable 28.11 «сторис для всех разделов», «Движок»):
// настоящий кадр игры сверху с подписью автора, шапка поверх кадра с маркой Secret Base sbgta.app (навык domen-na-ekranah);
// после обложки шапка сплошная. Хаб остаётся списком, а всё пошаговое из него открывается сторис (js/guide-stories.js).
export const COVERS = {
  saves: { f: 'img/guide/gta6/saves-cover.jpg', by: 'ZERO FAME' },
  walk: { f: 'img/guide/gta6/walk-cover.jpg', by: 'ZERO FAME' },
  endings: { f: 'img/guide/gta6/endings-cover.jpg', by: 'ZERO FAME' },
};
export const brandHTML = () => '<span class="sb-brand" aria-hidden="true"><img src="icons/brand-mark.svg" alt="" width="22" height="16"><span><b>Secret Base</b><small>sbgta.app</small></span></span>';
// шапка поверх обложки: левая кнопка, марка, правая кнопка (или пусто)
export const topHTML = (left, right = '<span class="g-ib" aria-hidden="true"></span>') => `<header class="g-top g-top-over">${left}${brandHTML()}${right}</header>`;
export function coverHTML(key, esc) {
  const cv = COVERS[key]; if (!cv) return '';
  return `<figure class="g-cover hub-cv"><img src="${esc(cv.f)}" alt="" decoding="async" fetchpriority="high"><span class="sb-wm" aria-hidden="true">sbgta.app</span>${cv.by ? `<figcaption>${esc(cv.by)}</figcaption>` : ''}</figure>`;
}
function sync(layer) {
  const t = layer.querySelector('.g-top-over'), cv = layer.querySelector('.hub-cv'), sc = cv?.closest('.g-scroll');
  if (t && sc && cv) t.classList.toggle('solid', sc.scrollTop > cv.offsetHeight - t.offsetHeight - 8);
}
// слушатель прокрутки — один раз на слой; после каждой отрисовки — sync
export function bindTop(layer) {
  if (!layer || layer.dataset.hubTop) { if (layer) sync(layer); return; }
  layer.dataset.hubTop = '1'; layer.addEventListener('scroll', () => sync(layer), { capture: true, passive: true }); sync(layer);
}
