/* Дрібні анімації інтерфейсу: хедер при скролі, плавне розкриття FAQ, поява блоку «Про мене».
 * Анімації фото (лайтбокс, карусель, плитки) — у gallery.js.
 * При prefers-reduced-motion усе працює без анімацій. */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  function isReduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /* ── Хедер: темнішає й отримує тінь після прокрутки ── */
  var header = document.querySelector('.page-header');
  if (header) {
    var ticking = false;
    var update = function () {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ── FAQ: висота розкривається плавно (нативний <details> стрибає) ── */
  function openItem(d) {
    var start = d.offsetHeight;
    d.style.overflow = 'hidden';
    d.classList.remove('is-closing');
    d.open = true;
    var end = d.offsetHeight;
    var a = d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 480, easing: EASE });
    var p = d.querySelector('p');
    if (p) p.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: EASE });
    d._anim = a;
    a.onfinish = a.oncancel = function () { if (d._anim === a) { d._anim = null; d.style.overflow = ''; } };
  }
  function closeItem(d) {
    var start = d.offsetHeight;
    var sum = d.querySelector('summary');
    var end = sum.offsetHeight + (d.offsetHeight - d.clientHeight);
    d.style.overflow = 'hidden';
    d.classList.add('is-closing');
    var a = d.animate([{ height: start + 'px' }, { height: end + 'px' }], { duration: 400, easing: EASE });
    d._anim = a;
    a.onfinish = function () {
      if (d._anim !== a) return;
      d._anim = null; d.open = false; d.classList.remove('is-closing'); d.style.overflow = '';
    };
  }
  [].slice.call(document.querySelectorAll('.faq details')).forEach(function (d) {
    var sum = d.querySelector('summary');
    if (!sum) return;
    sum.addEventListener('click', function (e) {
      if (isReduced() || !d.animate) return;      // без анімації — нативна поведінка
      e.preventDefault();
      var closingNow = d.open && !d.classList.contains('is-closing');
      if (d._anim) { var a = d._anim; d._anim = null; a.cancel(); }
      if (closingNow) closeItem(d); else openItem(d);
    });
  });

  /* ── Поява блоку «Про мене»: один раз, зі зсувом між рядками ── */
  if ('IntersectionObserver' in window && !isReduced()) {
    var targets = [].slice.call(document.querySelectorAll('.about-copy, .spec-row'));
    var io = new IntersectionObserver(function (entries) {
      var vis = entries.filter(function (e) { return e.isIntersecting; }).sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      vis.forEach(function (e, i) {
        io.unobserve(e.target);
        e.target.style.setProperty('--d', i * 80 + 'ms');
        e.target.classList.add('rv-in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    targets.forEach(function (t) { t.classList.add('rv'); io.observe(t); });
  }
})();
