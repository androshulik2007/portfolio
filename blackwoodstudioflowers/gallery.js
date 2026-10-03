(function () {
  'use strict';

  var data = window.GALLERY_DATA || { categories: [], items: [] };
  var grid = document.getElementById('gallery-grid');
  var filtersEl = document.getElementById('filters');
  var emptyEl = document.getElementById('gallery-empty');
  var countEl = document.getElementById('gallery-count');

  var catLabel = {};
  data.categories.forEach(function (c) { catLabel[c.id] = c.label; });

  /* Усе будується через DOM-API (textContent), тому назви з адмінки не можуть виконати код. */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function chevron(dir) {
    var s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('width', '20'); s.setAttribute('height', '20'); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.4');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', dir < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6');
    s.appendChild(p);
    return s;
  }
  function hue(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }

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
  var list = [];     // [{src, alt, title, tag, w, h}]
  var current = 0;

  function showFallback(ph) {
    lbImg.hidden = true;
    lbFallback.hidden = false;
    lbFallback.style.setProperty('--ar', ph.w + ' / ' + ph.h);
    lbFallback.style.setProperty('--arn', String(ph.w / ph.h));
    lbFallback.style.setProperty('--h', String(hue(ph.src)));
    lbFallback.setAttribute('aria-label', ph.alt);
  }

  function show(i) {
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var ph = list[current];
    lbImg.onerror = function () { showFallback(ph); };
    lbFallback.hidden = true;
    lbImg.hidden = false;
    lbImg.alt = ph.alt;
    lbImg.src = ph.src;
    lbTitle.textContent = ph.title;
    lbTag.textContent = ph.tag;
    lbCount.textContent = (current + 1) + ' / ' + list.length;
    [current + 1, current - 1].forEach(function (k) {   // підвантажуємо сусідів для миттєвого гортання
      var n = list[(k + list.length) % list.length];
      if (n && n !== ph) new Image().src = n.src;
    });
    var many = list.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
  }

  function openLb(items, idx) {
    list = items;
    show(idx);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.documentElement.classList.add('lb-open');
    btnClose.focus();
  }
  function closeLb() {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
    document.documentElement.classList.remove('lb-open');
  }

  btnPrev.addEventListener('click', function () { show(current - 1); });
  btnNext.addEventListener('click', function () { show(current + 1); });
  btnClose.addEventListener('click', closeLb);
  lb.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb();
  });
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ── Побудова плиток ── */
  var tiles = [];   // [{item, node}]

  function asLbPhoto(item, p) {
    return { src: p.src, alt: p.alt, title: item.title, tag: catLabel[item.cat] || '', w: p.w, h: p.h };
  }

  function markMissing(holder, src) {
    holder.classList.add('no-image');
    holder.style.setProperty('--h', String(hue(src)));
  }

  function captionNode(item) {
    return el('span', { class: 'tile-cap' }, [
      el('span', { class: 'tile-title', text: item.title }),
      el('span', { class: 'tile-tag', text: catLabel[item.cat] || '' }),
    ]);
  }

  function singleTile(item) {
    var p = item.photos[0];
    var img = el('img', { src: p.thumb, width: String(p.w), height: String(p.h), alt: p.alt, loading: 'lazy', decoding: 'async' });
    var btn = el('button', { class: 'tile-btn', type: 'button', 'aria-label': 'Відкрити фото: ' + p.alt }, [img, captionNode(item)]);
    var fig = el('figure', { class: 'tile', 'data-cat': item.cat }, [btn]);
    fig.style.setProperty('--ar', p.w + ' / ' + p.h);
    img.addEventListener('error', function () { markMissing(fig, p.src); }, { once: true });
    btn.addEventListener('click', function () {
      // Одиночні фото гортаються разом (як раніше); каруселі — окремо, у своїй серії.
      var singles = tiles.filter(function (t) { return !t.node.hidden && t.item.photos.length === 1; });
      var items = singles.map(function (t) { return asLbPhoto(t.item, t.item.photos[0]); });
      var idx = singles.map(function (t) { return t.item; }).indexOf(item);
      openLb(items, Math.max(0, idx));
    });
    return fig;
  }

  function carouselTile(item) {
    var n = item.photos.length;
    var first = item.photos[0];
    var track = el('div', { class: 'car-track' });
    var dots = el('div', { class: 'car-dots', 'aria-hidden': 'true' });
    var badge = el('span', { class: 'car-badge', text: '1 / ' + n });
    var slides = [];
    var dotNodes = [];
    var active = 0;

    item.photos.forEach(function (p, i) {
      var img = el('img', { src: p.thumb, width: String(p.w), height: String(p.h), alt: p.alt, loading: 'lazy', decoding: 'async' });
      var s = el('button', { class: 'car-slide', type: 'button', tabindex: i === 0 ? '0' : '-1',
        'aria-label': 'Відкрити фото ' + (i + 1) + ' з ' + n + ': ' + p.alt }, [img]);
      img.addEventListener('error', function () { markMissing(s, p.src); }, { once: true });
      s.addEventListener('click', function () {
        openLb(item.photos.map(function (q) { return asLbPhoto(item, q); }), i);
      });
      slides.push(s);
      track.appendChild(s);
      var d = el('span', { class: 'car-dot' + (i === 0 ? ' is-active' : '') });
      dotNodes.push(d);
      dots.appendChild(d);
    });

    var prev = el('button', { class: 'car-nav car-prev', type: 'button', 'aria-label': 'Попереднє фото в каруселі' }, [chevron(-1)]);
    var next = el('button', { class: 'car-nav car-next', type: 'button', 'aria-label': 'Наступне фото в каруселі' }, [chevron(1)]);

    var car = el('div', { class: 'car', role: 'group', 'aria-roledescription': 'карусель',
      'aria-label': item.title + ' — карусель, ' + n + ' фото' }, [track, prev, next, dots, badge]);
    car.style.setProperty('--ar', first.w + ' / ' + first.h);

    function goTo(i) {
      i = Math.max(0, Math.min(n - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    function sync() {
      var i = Math.round(track.scrollLeft / (track.clientWidth || 1));
      i = Math.max(0, Math.min(n - 1, i));
      if (i === active) return;
      active = i;
      dotNodes.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      slides.forEach(function (s, k) { s.tabIndex = k === i ? 0 : -1; });
      badge.textContent = (i + 1) + ' / ' + n;
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
    }
    prev.disabled = true;
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; sync(); });
    }, { passive: true });
    prev.addEventListener('click', function () { goTo(active - 1); });
    next.addEventListener('click', function () { goTo(active + 1); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); slides[Math.max(0, active - 1)].focus({ preventScroll: true }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); slides[Math.min(n - 1, active + 1)].focus({ preventScroll: true }); }
    });
    window.addEventListener('resize', function () { track.scrollLeft = active * track.clientWidth; });

    var fig = el('figure', { class: 'tile tile-carousel', 'data-cat': item.cat }, [car, captionNode(item)]);
    return fig;
  }

  data.items.forEach(function (item) {
    if (!item.photos || !item.photos.length) return;
    var node = item.photos.length > 1 ? carouselTile(item) : singleTile(item);
    tiles.push({ item: item, node: node });
    grid.appendChild(node);
  });

  /* ── Фільтри, лічильники ── */
  var usedCats = data.categories.filter(function (c) {
    return tiles.some(function (t) { return t.item.cat === c.id; });
  });
  var totalPhotos = tiles.reduce(function (s, t) { return s + t.item.photos.length; }, 0);

  [].slice.call(document.querySelectorAll('[data-stat="photos"]')).forEach(function (n) { n.textContent = totalPhotos; });
  [].slice.call(document.querySelectorAll('[data-stat="cats"]')).forEach(function (n) { n.textContent = usedCats.length; });

  var chips = [];
  function applyFilter(cat) {
    var n = 0;
    tiles.forEach(function (t) {
      var showIt = cat === 'all' || t.item.cat === cat;
      t.node.hidden = !showIt;
      if (showIt) n += t.item.photos.length;
    });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.filter === cat)); });
    if (countEl) countEl.textContent = n + ' фото';
  }

  if (!tiles.length) {
    filtersEl.hidden = true;
    emptyEl.hidden = false;
    if (countEl) countEl.textContent = '0 фото';
  } else {
    [{ id: 'all', label: 'Усі' }].concat(usedCats).forEach(function (c) {
      var b = el('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', text: c.label });
      b.dataset.filter = c.id;
      b.addEventListener('click', function () { applyFilter(c.id); });
      chips.push(b);
      filtersEl.appendChild(b);
    });
    applyFilter('all');
  }

  /* ── Заглушка для фото «Про мене» ── */
  [].slice.call(document.querySelectorAll('.about-photo-wrap img')).forEach(function (img) {
    function miss() { img.closest('.about-photo-wrap').classList.add('no-image'); }
    if (img.complete && img.naturalWidth === 0) miss();
    else img.addEventListener('error', miss, { once: true });
  });
})();
