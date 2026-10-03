(function () {
  'use strict';

  var data = window.GALLERY_DATA || { categories: [], items: [] };
  var grid = document.getElementById('gallery-grid');
  var filtersEl = document.getElementById('filters');
  var emptyEl = document.getElementById('gallery-empty');
  var countEl = document.getElementById('gallery-count');

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
  function isReduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

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

  /* Плавна поява зображення після завантаження */
  function fadeIn(img) {
    if (isReduced() || (img.complete && img.naturalWidth)) return;
    img.classList.add('is-loading');
    function done() { img.classList.remove('is-loading'); }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  }

  /* ── Лайтбокс ── */
  var lb = document.getElementById('lightbox');
  var frame = document.getElementById('lb-frame');
  var lbImg = document.getElementById('lb-img');
  var lbFallback = document.getElementById('lb-fallback');
  var lbInfo = document.getElementById('lb-info');
  var lbTitle = document.getElementById('lb-title');
  var lbTag = document.getElementById('lb-tag');
  var lbCount = document.getElementById('lb-count');
  var btnPrev = lb.querySelector('.lb-prev');
  var btnNext = lb.querySelector('.lb-next');
  var btnClose = lb.querySelector('.lb-close');
  var list = [];     // [{src, thumb, alt, title, tag, w, h, el, prepare}]
  var current = 0;
  var closing = false;
  var navAnims = [];
  var hiddenSrc = null;

  function active() { return lbImg.hidden ? lbFallback : lbImg; }

  /* Розмір фото рахуємо самі: так він відомий ще до завантаження файлу, і анімація точна. */
  function applySize(node, ph) {
    var s = Math.min(frame.clientWidth / ph.w, frame.clientHeight / ph.h, 1);
    node.style.width = Math.max(1, Math.round(ph.w * s)) + 'px';
    node.style.height = Math.max(1, Math.round(ph.h * s)) + 'px';
  }

  function showFallback(ph) {
    if (list[current] !== ph) return;
    lbImg.hidden = true;
    lbFallback.hidden = false;
    lbFallback.style.setProperty('--h', String(hue(ph.src)));
    lbFallback.setAttribute('aria-label', ph.alt);
    applySize(lbFallback, ph);
  }

  function setPhoto(ph) {
    lbFallback.hidden = true;
    lbImg.hidden = false;
    lbImg.onerror = function () { showFallback(ph); };
    lbImg.alt = ph.alt;
    lbImg.style.backgroundImage = ph.thumb ? 'url("' + ph.thumb + '")' : '';   // мініатюра як заглушка, поки вантажиться оригінал
    applySize(lbImg, ph);
    // Не показуємо попереднє фото, поки вантажиться нове: спершу порожній src, оригінал підставляємо, коли він уже в кеші.
    var tok = lbImg._tok = (lbImg._tok || 0) + 1;
    var pre = new Image();
    function apply() { if (lbImg._tok === tok) lbImg.src = ph.src; }
    pre.onload = apply; pre.onerror = apply;
    pre.src = ph.src;
    if (pre.complete) apply(); else lbImg.src = BLANK;
    lbTitle.textContent = ph.title;
    lbTag.textContent = ph.tag;
    lbCount.textContent = (current + 1) + ' / ' + list.length;
    [current + 1, current - 1].forEach(function (k) {   // підвантажуємо сусідів для миттєвого гортання
      var n = list[(k + list.length) % list.length];
      if (n && n !== ph) { new Image().src = n.src; if (n.thumb) new Image().src = n.thumb; }
    });
    var many = list.length > 1;
    btnPrev.hidden = !many;
    btnNext.hidden = !many;
  }

  function cancelNav() {
    navAnims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    navAnims = [];
    [].slice.call(frame.querySelectorAll('.lb-ghost')).forEach(function (g) { g.remove(); });
  }

  function makeGhost(fromX, fromOpacity, dir) {
    var src = active();
    var g = src.cloneNode(false);
    g.removeAttribute('id');
    g.hidden = false;
    g.className = src.className + ' lb-ghost';
    g.style.transform = ''; g.style.opacity = '';
    g.style.left = src.offsetLeft + 'px';
    g.style.top = src.offsetTop + 'px';
    frame.appendChild(g);
    var a = g.animate([
      { transform: 'translateX(' + fromX + 'px) scale(1)', opacity: fromOpacity },
      { transform: 'translateX(' + (fromX - dir * 70) + 'px) scale(0.94)', opacity: 0 }
    ], { duration: 420, easing: EASE, fill: 'forwards' });
    a.onfinish = function () { g.remove(); };
    navAnims.push(a);
  }

  /* dir: +1 — вперед, −1 — назад, 0 — без анімації. fromX/fromOpacity — де фото було після перетягування. */
  function show(i, dir, fromX, fromOpacity) {
    if (!list.length) return;
    var animate = !!dir && !isReduced() && lb.open;
    if (animate) {
      cancelNav();
      setSourceHidden(null, false);
      makeGhost(fromX || 0, fromOpacity == null ? 1 : fromOpacity, dir);
    }
    current = (i + list.length) % list.length;
    lbImg.style.transform = ''; lbImg.style.opacity = '';
    setPhoto(list[current]);
    if (animate) {
      navAnims.push(lbImg.animate([
        { transform: 'translateX(' + dir * 80 + 'px) scale(0.94)', opacity: 0 },
        { transform: 'none', opacity: 1 }
      ], { duration: 560, easing: EASE }));
      lbInfo.animate([
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 460, delay: 90, easing: EASE, fill: 'backwards' });
    }
  }

  /* Де на екрані зараз мініатюра цього фото (з урахуванням object-fit: contain у каруселі) */
  function thumbRect(ph) {
    if (!ph.el || !document.body.contains(ph.el)) return null;
    var r = ph.el.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    var s = Math.min(r.width / ph.w, r.height / ph.h);
    var w = ph.w * s, h = ph.h * s;
    var tile = ph.el.closest('.tile');
    return {
      left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h,
      radius: tile ? (parseFloat(getComputedStyle(tile).borderTopLeftRadius) || 0) : 0
    };
  }

  function setSourceHidden(ph, hide) {
    if (hiddenSrc) { hiddenSrc.style.visibility = ''; hiddenSrc = null; }
    if (hide) {
      var im = ph && ph.el && ph.el.querySelector('img');
      if (im) { im.style.visibility = 'hidden'; hiddenSrc = im; }
    }
  }

  function tf(rect, L) {
    return 'translate(' + (rect.left - L.left) + 'px,' + (rect.top - L.top) + 'px) scale(' + (rect.width / L.width) + ',' + (rect.height / L.height) + ')';
  }
  function rad(rect, L) { return (rect.radius || 8) / (rect.width / L.width) + 'px'; }

  /* Політ фото між двома прямокутниками: A → B, де L — природне місце елемента */
  function fly(node, A, B, L, duration) {
    var aIsL = A === L;
    var radA = aIsL ? '8px' : rad(A, L);
    var radB = B === L ? '8px' : rad(B, L);
    var anim = node.animate([
      { transformOrigin: '0 0', transform: aIsL ? 'none' : tf(A, L), borderRadius: radA },
      { transformOrigin: '0 0', transform: B === L ? 'none' : tf(B, L), borderRadius: radB }
    ], { duration: duration, easing: EASE, fill: 'both' });
    navAnims.push(anim);
    return anim;
  }

  function openLb(items, idx) {
    list = items;
    closing = false;
    cancelNav();
    lb.classList.remove('is-in');
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.documentElement.classList.add('lb-open');
    show(idx, 0);
    var ph = list[current];
    var node = active();
    var from = thumbRect(ph);
    var L = node.getBoundingClientRect();
    void lb.offsetWidth;
    lb.classList.add('is-in');
    if (!isReduced()) {
      if (from) {
        setSourceHidden(ph, true);
        fly(node, from, L, L, 620).onfinish = function () { setSourceHidden(ph, false); };
      } else {
        navAnims.push(node.animate([{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: EASE }));
      }
    }
    btnClose.focus();
  }

  /* Перед закриттям прокручуємо сторінку/карусель до фото, яке дивилися останнім, щоб було куди приземлитись */
  function revealSource(ph) {
    if (ph.prepare) ph.prepare();
    if (!ph.el || !document.body.contains(ph.el)) return;
    var tile = ph.el.closest('.tile') || ph.el;
    var r = tile.getBoundingClientRect();
    if (r.top < 90 || r.bottom > window.innerHeight - 8) {
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      tile.scrollIntoView({ block: 'center' });
      root.style.scrollBehavior = prev;
    }
  }

  function cleanup() {
    closing = false;
    document.documentElement.classList.remove('lb-open');
    lb.classList.remove('is-in');
    cancelNav();
    [lbImg, lbFallback].forEach(function (n) { n.style.transform = ''; n.style.opacity = ''; });
    setSourceHidden(null, false);
  }

  function finishClose() {
    if (lb.open) { if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open'); }
    cleanup();
  }

  function closeLb() {
    if (!lb.open || closing) return;
    closing = true;
    if (isReduced()) { finishClose(); return; }
    cancelNav();
    var ph = list[current];
    revealSource(ph);
    var node = active();
    node.style.transform = ''; node.style.opacity = '';
    var L = node.getBoundingClientRect();
    var to = thumbRect(ph);
    lb.classList.remove('is-in');
    var a;
    if (to) {
      setSourceHidden(ph, true);
      a = fly(node, L, to, L, 560);
    } else {
      a = node.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.94)' }], { duration: 340, easing: EASE, fill: 'forwards' });
      navAnims.push(a);
    }
    a.onfinish = finishClose;
  }

  btnPrev.addEventListener('click', function () { show(current - 1, -1); });
  btnNext.addEventListener('click', function () { show(current + 1, 1); });
  btnClose.addEventListener('click', closeLb);
  lb.addEventListener('close', cleanup);
  lb.addEventListener('cancel', function (e) { e.preventDefault(); closeLb(); });   // Esc — теж з анімацією
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, -1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, 1); }
  });
  window.addEventListener('resize', function () {
    if (lb.open && list.length && !closing) { applySize(active(), list[current]); }
  });

  /* Перетягування фото пальцем/мишею: фото йде за вказівником, відпустили — долистується або повертається */
  var drag = null;
  var dragged = false;
  frame.addEventListener('pointerdown', function (e) {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0) || list.length < 2 || closing) return;
    cancelNav();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, on: false };
  });
  frame.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      drag.on = true;
      try { frame.setPointerCapture(e.pointerId); } catch (err) {}
      frame.classList.add('is-dragging');
    }
    drag.dx = dx;
    var w = frame.clientWidth || 1;
    var n = active();
    n.style.transform = 'translateX(' + dx + 'px)';
    n.style.opacity = String(Math.max(0.25, 1 - Math.abs(dx) / w * 0.9));
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    frame.classList.remove('is-dragging');
    try { if (frame.hasPointerCapture(e.pointerId)) frame.releasePointerCapture(e.pointerId); } catch (err) {}
    if (!d.on) return;
    dragged = true;
    setTimeout(function () { dragged = false; }, 80);
    var n = active();
    var w = frame.clientWidth || 1;
    var fromOpacity = parseFloat(n.style.opacity) || 1;
    var speed = Math.abs(d.dx) / Math.max(1, performance.now() - d.t);
    var go = e.type === 'pointerup' && (Math.abs(d.dx) > w * 0.18 || (Math.abs(d.dx) > 40 && speed > 0.45));
    if (go) {
      show(current + (d.dx < 0 ? 1 : -1), d.dx < 0 ? 1 : -1, d.dx, fromOpacity);
    } else {
      var tr = n.style.transform;
      n.style.transform = ''; n.style.opacity = '';
      if (!isReduced()) navAnims.push(n.animate([{ transform: tr, opacity: fromOpacity }, { transform: 'none', opacity: 1 }], { duration: 520, easing: EASE }));
    }
  }
  frame.addEventListener('pointerup', endDrag);
  frame.addEventListener('pointercancel', endDrag);

  lb.addEventListener('click', function (e) {
    if (dragged) return;
    if (e.target === lb || e.target.classList.contains('lb-stage') || e.target === frame) closeLb();
  });

  /* ── Анімація появи плиток ── */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(onIntersect, { rootMargin: '0px 0px -5% 0px', threshold: 0.04 }) : null;

  function armReveal(node) {
    if (!io || isReduced()) return;
    node._rv = (node._rv || 0) + 1;
    node.style.removeProperty('--d');
    node.classList.remove('rv-in');
    node.classList.add('rv');
    io.unobserve(node);
    io.observe(node);
  }
  function onIntersect(entries) {
    var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
      return (a.boundingClientRect.top - b.boundingClientRect.top) || (a.boundingClientRect.left - b.boundingClientRect.left);
    });
    vis.forEach(function (e, i) {
      var n = e.target, tok = n._rv;
      io.unobserve(n);
      n.style.setProperty('--d', Math.min(i, 8) * 70 + 'ms');
      n.classList.add('rv-in');
      function end(ev) {
        if (ev && (ev.target !== n || ev.propertyName !== 'opacity')) return;
        n.removeEventListener('transitionend', end);
        if (n._rv !== tok) return;
        n.classList.remove('rv', 'rv-in');
        n.style.removeProperty('--d');
      }
      n.addEventListener('transitionend', end);
      setTimeout(function () { end(null); }, 2600);
    });
  }

  /* ── Побудова плиток ── */
  var tiles = [];   // [{item, node}]

  function asLbPhoto(item, p, srcEl, prepare) {
    return { src: p.src, thumb: p.thumb, alt: p.alt, title: item.title, tag: catLabel[item.cat] || '', w: p.w, h: p.h, el: srcEl, prepare: prepare };
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
    fadeIn(img);
    img.addEventListener('error', function () { markMissing(fig, p.src); }, { once: true });
    btn.addEventListener('click', function () {
      // Одиночні фото гортаються разом (як раніше); каруселі — окремо, у своїй серії.
      var singles = tiles.filter(function (t) { return !t.node.hidden && t.item.photos.length === 1; });
      var items = singles.map(function (t) { return asLbPhoto(t.item, t.item.photos[0], t.node.querySelector('.tile-btn')); });
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
    var lbItems = [];

    function instantGo(i) {
      cancelScroll();
      track.scrollLeft = i * track.clientWidth;
      sync(); parallax();
    }

    item.photos.forEach(function (p, i) {
      var img = el('img', { src: p.thumb, width: String(p.w), height: String(p.h), alt: p.alt, loading: 'lazy', decoding: 'async' });
      var s = el('button', { class: 'car-slide', type: 'button', tabindex: i === 0 ? '0' : '-1',
        'aria-label': 'Відкрити фото ' + (i + 1) + ' з ' + n + ': ' + p.alt }, [img]);
      fadeIn(img);
      img.addEventListener('error', function () { markMissing(s, p.src); }, { once: true });
      lbItems.push(asLbPhoto(item, p, s, function () { instantGo(i); }));
      s.addEventListener('click', function () { openLb(lbItems, i); });
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

    /* Власне гортання з плавним сповільненням (нативне smooth у різних браузерах рване). На час анімації вимикаємо snap. */
    var raf = 0;
    function cancelScroll() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; track.style.scrollSnapType = ''; }
    }
    function goTo(i) {
      i = Math.max(0, Math.min(n - 1, i));
      var to = i * track.clientWidth;
      if (isReduced()) { track.scrollTo({ left: to, behavior: 'auto' }); return; }
      cancelScroll();
      var from = track.scrollLeft, dist = to - from;
      if (Math.abs(dist) < 1) return;
      var t0 = performance.now(), dur = 640;
      track.style.scrollSnapType = 'none';
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur);
        track.scrollLeft = from + dist * (1 - Math.pow(1 - p, 5));
        if (p < 1) raf = requestAnimationFrame(step);
        else { raf = 0; track.style.scrollSnapType = ''; }
      })(t0);
    }
    ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) { track.addEventListener(ev, cancelScroll, { passive: true }); });

    /* Паралакс: фото трохи «відстає» від рамки й затемнюється, поки слайд виїжджає */
    function parallax() {
      var w = track.clientWidth || 1, sl = track.scrollLeft;
      slides.forEach(function (s, k) {
        var o = Math.max(-1, Math.min(1, (k * w - sl) / w));
        s.style.setProperty('--o', o.toFixed(3));
        s.style.setProperty('--a', Math.abs(o).toFixed(3));
      });
    }
    function sync() {
      var i = Math.round(track.scrollLeft / (track.clientWidth || 1));
      i = Math.max(0, Math.min(n - 1, i));
      if (i === active) return;
      active = i;
      dotNodes.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      slides.forEach(function (s, k) { s.tabIndex = k === i ? 0 : -1; });
      badge.textContent = (i + 1) + ' / ' + n;
      if (!isReduced()) badge.animate([{ transform: 'translateY(6px)', opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: EASE });
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
    }
    prev.disabled = true;
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; sync(); parallax(); });
    }, { passive: true });
    prev.addEventListener('click', function () { goTo(active - 1); });
    next.addEventListener('click', function () { goTo(active + 1); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); slides[Math.max(0, active - 1)].focus({ preventScroll: true }); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); slides[Math.min(n - 1, active + 1)].focus({ preventScroll: true }); }
    });
    window.addEventListener('resize', function () { track.scrollLeft = active * track.clientWidth; parallax(); });

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

  function countUp(node, to) {
    if (isReduced() || to < 2) { node.textContent = to; return; }
    var t0 = performance.now(), dur = 1100;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      node.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  [].slice.call(document.querySelectorAll('[data-stat="photos"]')).forEach(function (n) { setTimeout(function () { countUp(n, totalPhotos); }, 450); });
  [].slice.call(document.querySelectorAll('[data-stat="cats"]')).forEach(function (n) { setTimeout(function () { countUp(n, usedCats.length); }, 450); });

  var chips = [];
  var activeCat = null;
  function applyFilter(cat) {
    if (cat === activeCat) return;
    activeCat = cat;
    var n = 0;
    tiles.forEach(function (t) {
      var showIt = cat === 'all' || t.item.cat === cat;
      t.node.hidden = !showIt;
      if (showIt) { n += t.item.photos.length; armReveal(t.node); }
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

})();
