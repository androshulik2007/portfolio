(function () {
  'use strict';

  // Рік у футері
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Мобільне меню
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- Cookie consent ----------
  var banner = document.getElementById('cookie-banner');
  var KEY = 'cookie-consent';
  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } }

  // Аналітика — ЗАГЛУШКА. Реального збору даних немає.
  // Коли будете готові, додайте тут завантаження GA4 / Plausible.
  // Викликається ЛИШЕ після того, як відвідувач натиснув «Прийняти».
  function loadAnalytics() {
    // TODO: приклад (розкоментуйте та підставте свій ID після погодження):
    // var s = document.createElement('script');
    // s.async = true;
    // s.src = 'https://plausible.io/js/script.js';
    // s.setAttribute('data-domain', 'your-domain.com');
    // document.head.appendChild(s);
  }

  var consent = getConsent();
  if (consent === 'accepted') {
    loadAnalytics();
  } else if (!consent && banner) {
    banner.hidden = false;
  }
  var acc = document.getElementById('cookie-accept');
  var rej = document.getElementById('cookie-reject');
  if (acc) acc.addEventListener('click', function () { setConsent('accepted'); banner.hidden = true; loadAnalytics(); });
  if (rej) rej.addEventListener('click', function () { setConsent('rejected'); banner.hidden = true; });

  // ---------- Валідація форми ----------
  var form = document.getElementById('callback-form');
  if (!form) return;
  var status = document.getElementById('form-status');

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Вкажіть ім’я (мінімум 2 символи).'; },
    phone: function (v) { return /^\+?[0-9\s()\-]{10,18}$/.test(v.trim()) ? '' : 'Введіть коректний номер телефону, напр. +380 00 000 00 00.'; },
    message: function (v) { return v.length <= 500 ? '' : 'Повідомлення задовге (макс. 500 символів).'; },
    consent: function (_v, el) { return el.checked ? '' : 'Потрібна згода на обробку даних.'; }
  };

  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var msg = rule(el.value, el);
    var err = document.getElementById(el.id + '-error');
    if (err) err.textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }

  form.querySelectorAll('input, textarea').forEach(function (el) {
    el.addEventListener('blur', function () { validateField(el); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    form.querySelectorAll('input, textarea').forEach(function (el) {
      if (!validateField(el)) { ok = false; if (!first) first = el; }
    });
    if (!ok) { status.textContent = ''; first.focus(); return; }

    // TODO: надішліть дані на ваш бекенд / сервіс форм (Formspree, власний API тощо).
    // Наразі це демо: дані нікуди не відправляються.
    status.textContent = 'Дякуємо! (Демо-режим: форма ще не підключена до сервера — для термінових випадків телефонуйте.)';
    form.reset();
  });
})();
