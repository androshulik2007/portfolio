/* ==========================================================
   Налаштування — заповніть перед запуском
   ========================================================== */
// Адреса, куди відправляти форму (ваш бекенд, Formspree, Netlify Forms тощо).
// Поки порожньо — форма лише перевіряє поля і НІЧОГО не відправляє.
var FORM_ENDPOINT = "";

/* ---------- Мобільне меню ---------- */
(function () {
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("main-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      btn.focus();
    }
  });
})();

/* ---------- Cookie-згода + аналітика ---------- */
(function () {
  var KEY = "cookie-consent"; // "granted" | "denied"
  var banner = document.getElementById("consent");
  if (!banner) return;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // Аналітика-ЗАГЛУШКА. Нічого не завантажується, доки ви самі не розкоментуєте код
  // і користувач не натисне «Прийняти».
  function loadAnalytics() {
    // Варіант Plausible (без cookies, найпростіший):
    // var s = document.createElement("script");
    // s.defer = true; s.src = "https://plausible.io/js/script.js";
    // s.setAttribute("data-domain", "ВАШ-ДОМЕН.ua");
    // document.head.appendChild(s);
    //
    // Варіант GA4: підключайте gtag.js тут, і лише тут.
  }

  function show() { banner.classList.add("show"); }
  function hide() { banner.classList.remove("show"); }

  var saved = read();
  if (saved === "granted") loadAnalytics();
  else if (saved !== "denied") show();

  document.getElementById("consent-accept").addEventListener("click", function () {
    write("granted"); hide(); loadAnalytics();
  });
  document.getElementById("consent-reject").addEventListener("click", function () {
    write("denied"); hide();
  });
  var reopen = document.getElementById("consent-reopen");
  if (reopen) reopen.addEventListener("click", function () { show(); document.getElementById("consent-accept").focus(); });
})();

/* ---------- Форма: валідація на клієнті ---------- */
(function () {
  var form = document.getElementById("callback-form");
  if (!form) return;
  var status = document.getElementById("form-status");

  var rules = {
    name: function (v) {
      if (!v.trim()) return "Вкажіть, як до вас звертатися.";
      if (v.trim().length < 2) return "Ім'я має містити щонайменше 2 символи.";
      return "";
    },
    phone: function (v) {
      if (!v.trim()) return "Вкажіть номер телефону.";
      var digits = v.replace(/\D/g, "");
      if (!/^[+\d\s()\-]+$/.test(v) || digits.length < 10 || digits.length > 12)
        return "Введіть номер у форматі +380 XX XXX XX XX.";
      return "";
    },
    consent: function (_v, el) {
      return el.checked ? "" : "Потрібна згода на обробку даних, щоб ми могли вам передзвонити.";
    }
  };

  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var msg = rule(el.value, el);
    var err = document.getElementById("err-" + el.name);
    err.textContent = msg;
    if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid");
    return !msg;
  }

  form.addEventListener("blur", function (e) { if (e.target.name) validateField(e.target); }, true);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fields = form.querySelectorAll("[name]");
    var firstBad = null;
    fields.forEach(function (el) { if (!validateField(el) && !firstBad) firstBad = el; });
    status.classList.remove("show");
    if (firstBad) { firstBad.focus(); return; }

    if (!FORM_ENDPOINT) {
      // TODO: вкажіть FORM_ENDPOINT. Без нього дані нікуди не йдуть, тому чесно про це повідомляємо.
      status.textContent = "Форму ще не підключено до сервера, тому заявку не надіслано. Будь ласка, зателефонуйте нам.";
      status.classList.add("show");
      return;
    }

    var data = new FormData(form);
    fetch(FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("bad status");
        form.reset();
        status.textContent = "Дякуємо! Заявку отримано, ми вам передзвонимо.";
        status.classList.add("show");
      })
      .catch(function () {
        status.textContent = "Не вдалося надіслати заявку. Спробуйте ще раз або зателефонуйте нам.";
        status.classList.add("show");
      });
  });
})();
