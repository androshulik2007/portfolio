/* Cookie consent + аналітика (заглушка).
 *
 * Аналітика НЕ збирає нічого, доки:
 *   1) ANALYTICS_ID нижче порожній, або
 *   2) відвідувач не натиснув «Прийняти».
 *
 * TODO перед запуском: вставте ID GA4 (формат 'G-XXXXXXXXXX').
 * Для Plausible/іншого сервісу замініть тіло функції loadAnalytics().
 */
(function () {
  'use strict';

  var ANALYTICS_ID = ''; // TODO: 'G-XXXXXXXXXX'
  var KEY = 'cookie_consent';

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setChoice(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* сховище недоступне — вибір діє лише до перезавантаження */ }
  }
  function clearChoice() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function loadAnalytics() {
    if (!ANALYTICS_ID || document.getElementById('analytics-script')) return;
    var s = document.createElement('script');
    s.id = 'analytics-script';
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ANALYTICS_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', ANALYTICS_ID, { anonymize_ip: true });
  }

  function removeBanner() {
    var b = document.getElementById('cookie-banner');
    if (b) b.remove();
  }

  function showBanner() {
    if (document.getElementById('cookie-banner')) return;
    var banner = document.createElement('section');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('aria-labelledby', 'cookie-title');
    banner.innerHTML =
      '<h2 id="cookie-title">Cookie та аналітика</h2>' +
      '<p>Аналітичні cookie допомагають зрозуміти, які фото цікавлять відвідувачів. ' +
      'Вони вмикаються лише після вашої згоди. Докладніше — у ' +
      '<a href="privacy.html">Політиці конфіденційності</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-primary" data-consent="accepted">Прийняти</button>' +
      '<button type="button" class="btn btn-outline" data-consent="declined">Відхилити</button>' +
      '</div>';
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      var choice = btn.getAttribute('data-consent');
      setChoice(choice);
      if (choice === 'accepted') loadAnalytics();
      removeBanner();
    });
    document.body.appendChild(banner);
  }

  var saved = getChoice();
  if (saved === 'accepted') loadAnalytics();
  if (!saved) showBanner();

  // Кнопка «Налаштування cookie» у футері — дає змінити вибір.
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cookie-settings]')) {
      clearChoice();
      showBanner();
    }
  });
})();
