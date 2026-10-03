(function () {
  'use strict';

  var tiles = [].slice.call(document.querySelectorAll('.tile'));
  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var countEl = document.getElementById('gallery-count');

  /* ── Заглушка для відсутніх зображень ── */
  function markMissing(img) {
    var holder = img.closest('.tile, .about-photo-wrap');
    if (holder) holder.classList.add('no-image');
  }
  [].slice.call(document.querySelectorAll('.tile img, .about-photo-wrap img')).forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
      markMissing(img);
    } else {
      img.addEventListener('error', function () { markMissing(img); }, { once: true });
    }
  });

  /* ── Статистика з реальної кількості фото ── */
  var cats = {};
  tiles.forEach(function (t) { cats[t.dataset.cat] = true; });
  [].slice.call(document.querySelectorAll('[data-stat="photos"]')).forEach(function (el) { el.textContent = tiles.length; });
  [].slice.call(document.querySelectorAll('[data-stat="cats"]')).forEach(function (el) { el.textContent = Object.keys(cats).length; });

  /* ── Фільтр ── */
  function applyFilter(cat) {
    var n = 0;
    tiles.forEach(function (t) {
      var show = cat === 'all' || t.dataset.cat === cat;
      t.hidden = !show;
      if (show) n++;
    });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.filter === cat)); });
    if (countEl) countEl.textContent = n + ' фото';
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { applyFilter(c.dataset.filter); });
  });
  applyFilter('all');

  /* ── Лайтбокс ── */
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lb-img');
  var lbFallback = document.getElementById('lb-fallback');
  var lbTitle = document.getElementById('lb-title');
  var lbTag = document.getElementById('lb-tag');
  var lbCount = document.getElementById('lb-count');
  var btnPrev = lb.querySelector('.lb-prev');
  var btnNext = lb.querySelector('.lb-next');
  var btnClose = lb.querySelector('.lb-close');
  var list = [];
  var current = 0;

  function visibleTiles() { return tiles.filter(function (t) { return !t.hidden; }); }

  function showFallback(tile, alt) {
    var w = Number(tile.dataset.w) || 3;
    var h = Number(tile.dataset.h) || 2;
    lbImg.hidden = true;
    lbFallback.hidden = false;
    lbFallback.style.setProperty('--ar', w + ' / ' + h);
    lbFallback.style.setProperty('--arn', String(w / h));
    lbFallback.style.setProperty('--h', tile.style.getPropertyValue('--h') || '210');
    lbFallback.setAttribute('aria-label', alt);
  }

  function show(i) {
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var tile = list[current];
    var btn = tile.querySelector('.tile-btn');
    var img = tile.querySelector('img');
    var alt = img.getAttribute('alt') || '';

    lbImg.onerror = function () { showFallback(tile, alt); };
    if (tile.classList.contains('no-image')) {
      showFallback(tile, alt);
    } else {
      lbFallback.hidden = true;
      lbImg.hidden = false;
      lbImg.alt = alt;
      lbImg.src = btn.dataset.full || img.getAttribute('src');
    }

    lbTitle.textContent = tile.querySelector('.tile-title').textContent;
    lbTag.textContent = tile.querySelector('.tile-tag').textContent;
    lbCount.textContent = (current + 1) + ' / ' + list.length;

    // Підвантажуємо сусідні фото, щоб гортання на телефоні було миттєвим
    [current + 1, current - 1].forEach(function (k) {
      var n = list[(k + list.length) % list.length];
      if (n && n !== tile && !n.classList.contains('no-image')) {
        var nb = n.querySelector('.tile-btn');
        new Image().src = nb.dataset.full || n.querySelector('img').getAttribute('src');
      }
    });

    var many = list.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
  }

  function open(tile) {
    list = visibleTiles();
    var idx = list.indexOf(tile);
    show(idx < 0 ? 0 : idx);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.documentElement.classList.add('lb-open');
    btnClose.focus();
  }

  function close() {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
    document.documentElement.classList.remove('lb-open');
  }

  tiles.forEach(function (t) {
    t.querySelector('.tile-btn').addEventListener('click', function () { open(t); });
  });
  btnPrev.addEventListener('click', function () { show(current - 1); });
  btnNext.addEventListener('click', function () { show(current + 1); });
  btnClose.addEventListener('click', close);
  lb.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); });

  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });

  // Клік по темному тлу закриває перегляд
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-stage')) close();
  });

  // Свайп на телефоні
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
