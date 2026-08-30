// ЦЕХ №9 BARBERSHOP — shared behaviour
// Note: this runs inside a preview sandbox that does not support
// localStorage/sessionStorage, so consent state below is kept in a
// plain in-memory variable for the session. In a real production
// deployment (own hosting), replace `let consentState` persistence
// with a first-party cookie or localStorage so the choice survives reloads.

(function () {
  "use strict";

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Booking form validation ---------- */
  var form = document.getElementById("booking-form");
  if (form) {
    var status = document.getElementById("form-status");
    var phonePattern = /^[+0-9()\s-]{7,20}$/;

    function setError(field, message) {
      var errEl = document.getElementById(field.name + "-err");
      if (errEl) errEl.textContent = message || "";
      field.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validateField(field) {
      if (field.hasAttribute("required") && !field.value.trim()) {
        setError(field, "Обов'язкове поле.");
        return false;
      }
      if (field.type === "email" && field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        setError(field, "Перевірте формат email.");
        return false;
      }
      if (field.name === "phone" && field.value && !phonePattern.test(field.value)) {
        setError(field, "Перевірте формат телефону, напр. +380 67 123 45 67.");
        return false;
      }
      setError(field, "");
      return true;
    }

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("blur", function () { validateField(field); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (!validateField(field)) valid = false;
      });
      if (!valid) {
        status.textContent = "Виправте позначені поля перед відправкою.";
        status.dataset.state = "error";
        return;
      }
      // NOTE: no real backend is wired up in this template.
      // Wire this up to your booking API / CRM before going live.
      status.textContent = "Заявку прийнято. Ми зателефонуємо для підтвердження часу.";
      status.dataset.state = "success";
      form.reset();
    });
  }

  /* ---------- Cookie consent (session-only, see note above) ---------- */
  var consentState = null; // null = not decided, "accepted" | "rejected"
  var banner = document.getElementById("cookie-banner");
  var acceptBtn = document.getElementById("cookie-accept");
  var rejectBtn = document.getElementById("cookie-reject");

  function loadAnalyticsIfConsented() {
    if (consentState !== "accepted") return;
    // ------------------------------------------------------------
    // GA4 / Plausible placeholder — intentionally NOT wired to a
    // real property. Uncomment and add a real ID before launch.
    // ------------------------------------------------------------
    // var s = document.createElement("script");
    // s.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX";
    // s.async = true;
    // document.head.appendChild(s);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){ dataLayer.push(arguments); }
    // gtag('js', new Date());
    // gtag('config', 'G-XXXXXXX');
    console.info("[analytics] consent accepted — analytics snippet is a placeholder, not loaded.");
  }

  if (banner) {
    if (consentState === null) banner.classList.add("visible");
    if (acceptBtn) acceptBtn.addEventListener("click", function () {
      consentState = "accepted";
      banner.classList.remove("visible");
      loadAnalyticsIfConsented();
    });
    if (rejectBtn) rejectBtn.addEventListener("click", function () {
      consentState = "rejected";
      banner.classList.remove("visible");
    });
  }
})();
