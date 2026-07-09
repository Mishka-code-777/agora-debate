/* ==========================================================================
   Agora — app.js
   Theme + language state, header/footer injection, i18n, UI wiring.
   Static design: no animations, JS only powers toggles & disclosure.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE = { theme: "agora-theme", lang: "agora-lang" };

  /* ---------------------- Icons (inline SVG) ---------------------- */
  var P = {
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"/>',
    up: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    down: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    sort: '<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'
  };
  function icon(name, cls) {
    return (
      '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || "") + "</svg>"
    );
  }
  window.agoraIcon = icon;

  /* ---------------------- Theme + language ---------------------- */
  function initialTheme() {
    var s = localStorage.getItem(STORAGE.theme);
    if (s === "light" || s === "dark") return s;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function initialLang() {
    var s = localStorage.getItem(STORAGE.lang);
    if (s === "en" || s === "ru") return s;
    return (navigator.language || "en").toLowerCase().indexOf("ru") === 0 ? "ru" : "en";
  }
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(STORAGE.theme, t);
    syncToggles();
  }
  function setLang(l) {
    var root = document.documentElement;
    root.setAttribute("data-lang", l);
    root.lang = l;
    localStorage.setItem(STORAGE.lang, l);
    applyI18n(l);
    syncToggles();
  }
  function applyI18n(l) {
    // text content
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + l);
      if (v != null) el.textContent = v;
    });
    // innerHTML (strings that contain links/markup)
    document.querySelectorAll("[data-en-html]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-html");
      if (v != null) el.innerHTML = v;
    });
    // placeholders
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-ph");
      if (v != null) el.setAttribute("placeholder", v);
    });
    // aria-labels / titles
    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-aria");
      if (v != null) el.setAttribute("aria-label", v);
    });
  }
  window.agoraT = function (en, ru) {
    return document.documentElement.getAttribute("data-lang") === "ru" ? ru : en;
  };

  function syncToggles() {
    var theme = document.documentElement.getAttribute("data-theme");
    var lang = document.documentElement.getAttribute("data-lang");
    document.querySelectorAll("[data-set-theme]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === theme));
    });
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
  }

  /* ---------------------- Header / footer markup ---------------------- */
  var cfg = window.AGORA || {};
  var auth = cfg.auth || "guest"; // 'guest' | 'user'
  var active = cfg.active || "";
  var username = cfg.username || "sofia";

  function bilingual(en, ru) {
    return 'data-en="' + en + '" data-ru="' + ru + '"';
  }

  function themeLangControls() {
    return (
      '<div class="segmented" role="group" ' + 'aria-label="Theme">' +
        '<button type="button" data-set-theme="light" title="Light">' + icon("sun") + '</button>' +
        '<button type="button" data-set-theme="dark" title="Dark">' + icon("moon") + '</button>' +
      "</div>" +
      '<div class="segmented" role="group" aria-label="Language">' +
        '<button type="button" data-set-lang="en">EN</button>' +
        '<button type="button" data-set-lang="ru">RU</button>' +
      "</div>"
    );
  }

  function navLinks() {
    function link(href, key, en, ru) {
      var cur = active === key ? ' aria-current="page"' : "";
      return '<a href="' + href + '"' + cur + " " + bilingual(en, ru) + ">" + en + "</a>";
    }
    return (
      link("debates.html", "debates", "Debates", "Дебаты") +
      link("users.html", "users", "Users", "Пользователи")
    );
  }

  function accountArea(mobile) {
    if (auth === "user") {
      if (mobile) {
        return (
          '<a href="profile.html" ' + bilingual("My account", "Мой аккаунт") + ">My account</a>" +
          '<a href="my-debates.html" ' + bilingual("My debates", "Мои дебаты") + ">My debates</a>" +
          '<a href="index.html" ' + bilingual("Log out", "Выйти") + ">Log out</a>"
        );
      }
      return (
        '<div class="dropdown">' +
          '<button class="btn btn--ghost" data-dropdown-toggle aria-expanded="false">' +
            '<span class="avatar avatar--sm">' + username.charAt(0) + "</span>" +
            '<span ' + bilingual("My account", "Мой аккаунт") + ">My account</span>" +
            icon("chevron") +
          "</button>" +
          '<div class="dropdown__menu" hidden>' +
            '<a class="dropdown__item" href="profile.html">' +
              '<span ' + bilingual("Profile settings", "Настройки профиля") + ">Profile settings</span>" + icon("user") +
            "</a>" +
            '<a class="dropdown__item" href="my-debates.html">' +
              '<span ' + bilingual("My debates", "Мои дебаты") + ">My debates</span>" + icon("grid") +
            "</a>" +
            '<div class="dropdown__sep"></div>' +
            '<a class="dropdown__item" href="index.html">' +
              '<span ' + bilingual("Log out", "Выйти") + ">Log out</span>" + icon("logout") +
            "</a>" +
          "</div>" +
        "</div>"
      );
    }
    // guest
    return (
      '<a class="btn btn--ghost" href="login.html" ' + bilingual("Log in", "Войти") + ">Log in</a>" +
      '<a class="btn btn--primary" href="register.html" ' + bilingual("Register", "Регистрация") + ">Register</a>"
    );
  }

  function buildHeader() {
    var createBtn =
      auth === "user"
        ? '<a class="btn btn--accent desktop-only" href="debate-config.html">' +
          icon("plus") + '<span ' + bilingual("New debate", "Создать дебат") + ">New debate</span></a>"
        : "";
    var bell =
      auth === "user"
        ? '<a class="icon-btn has-badge" href="notifications.html" ' +
          'data-en-aria="Notifications" data-ru-aria="Уведомления">' + icon("bell") + "</a>"
        : "";
    return (
      '<header class="site-header"><div class="container"><div class="site-header__inner">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand__mark">A</span><span>Agora</span>' +
        "</a>" +
        '<nav class="main-nav" aria-label="Primary">' + navLinks() + "</nav>" +
        '<div class="header-spacer"></div>' +
        '<div class="header-actions">' +
          createBtn +
          '<span class="desktop-only">' + themeLangControls() + "</span>" +
          bell +
          '<span class="desktop-only">' + accountArea(false) + "</span>" +
          '<button class="icon-btn hamburger" data-toggle="mobile-menu" aria-expanded="false" ' +
            'data-en-aria="Open menu" data-ru-aria="Открыть меню">' + icon("menu") + "</button>" +
        "</div>" +
      "</div></div></header>" +
      // Mobile drawer
      '<div class="mobile-menu" id="mobile-menu" hidden>' +
        '<nav aria-label="Mobile">' + navLinks() +
          (auth === "user"
            ? '<a href="debate-config.html" ' + bilingual("New debate", "Создать дебат") + ">New debate</a>"
            : "") +
        "</nav>" +
        '<div class="menu-actions">' +
          accountArea(true) +
          '<div class="cluster" style="justify-content:space-between;margin-top:1rem">' +
            themeLangControls() +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function buildFooter() {
    return (
      '<footer class="site-footer"><div class="container"><div class="site-footer__inner">' +
        "<div>" +
          '<span data-en-html="Developed by SPOF Code · Design by Agora" ' +
          'data-ru-html="Разработка — SPOF Code · Дизайн — Agora">' +
          "Developed by SPOF Code · Design by Agora</span>" +
        "</div>" +
        "<div>© SPOF Code. All rights reserved. 2026</div>" +
      "</div></div></footer>"
    );
  }

  /* ---------------------- Wiring ---------------------- */
  function closeAllDropdowns(except) {
    document.querySelectorAll(".dropdown__menu").forEach(function (m) {
      if (m !== except) {
        m.hidden = true;
        var t = m.parentElement.querySelector("[data-dropdown-toggle]");
        if (t) t.setAttribute("aria-expanded", "false");
      }
    });
  }

  function wire() {
    document.addEventListener("click", function (e) {
      // Theme / language
      var st = e.target.closest("[data-set-theme]");
      if (st) { setTheme(st.getAttribute("data-set-theme")); return; }
      var sl = e.target.closest("[data-set-lang]");
      if (sl) { setLang(sl.getAttribute("data-set-lang")); return; }

      // Mobile menu
      var mt = e.target.closest('[data-toggle="mobile-menu"]');
      if (mt) {
        var menu = document.getElementById("mobile-menu");
        var open = menu.hidden;
        menu.hidden = !open;
        mt.setAttribute("aria-expanded", String(open));
        mt.innerHTML = icon(open ? "x" : "menu");
        return;
      }

      // Filters panel
      var ft = e.target.closest('[data-toggle="filters"]');
      if (ft) {
        var panel = document.getElementById(ft.getAttribute("data-target") || "filters-panel");
        if (panel) {
          var openF = panel.hidden;
          panel.hidden = !openF;
          ft.setAttribute("aria-expanded", String(openF));
        }
        return;
      }

      // Dropdown toggle
      var dt = e.target.closest("[data-dropdown-toggle]");
      if (dt) {
        var dm = dt.parentElement.querySelector(".dropdown__menu");
        var willOpen = dm.hidden;
        closeAllDropdowns(willOpen ? dm : null);
        dm.hidden = !willOpen;
        dt.setAttribute("aria-expanded", String(willOpen));
        return;
      }

      // Open dialog
      var od = e.target.closest("[data-open-dialog]");
      if (od) {
        e.preventDefault();
        var d = document.getElementById(od.getAttribute("data-open-dialog"));
        if (d) { d.hidden = false; document.body.style.overflow = "hidden"; }
        return;
      }

      // Close dialog
      var cd = e.target.closest("[data-close-dialog]");
      if (cd) {
        var back = cd.closest(".dialog-backdrop");
        if (back) { back.hidden = true; document.body.style.overflow = ""; }
        return;
      }
      // Backdrop click closes
      if (e.target.classList && e.target.classList.contains("dialog-backdrop")) {
        e.target.hidden = true; document.body.style.overflow = "";
        return;
      }

      if (!e.target.closest(".dropdown")) closeAllDropdowns(null);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeAllDropdowns(null);
        document.querySelectorAll(".dialog-backdrop:not([hidden])").forEach(function (b) {
          b.hidden = true; document.body.style.overflow = "";
        });
      }
    });
  }

  /* ---------------------- Boot ---------------------- */
  function boot() {
    var h = document.getElementById("site-header");
    if (h) h.outerHTML = buildHeader();
    var f = document.getElementById("site-footer");
    if (f) f.outerHTML = buildFooter();
    setLang(initialLang());     // also runs applyI18n across injected markup
    setTheme(initialTheme());
    // Auto-inject inline icons for any [data-icon] element
    document.querySelectorAll("[data-icon]").forEach(function (el) {
      if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", icon(el.getAttribute("data-icon")));
    });
    wire();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
