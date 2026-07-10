/* ==========================================================================
   Agora — app.js
   Theme + language, session-aware header/footer, i18n, render helpers,
   form utilities, and UI wiring. Static design: no decorative animation.
   Depends on store.js (window.Store) being loaded first.
   ========================================================================== */
(function () {
  "use strict";

  var STORAGE = { theme: "agora-theme", lang: "agora-lang" };

  /* ---------------------- Icons ---------------------- */
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
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
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
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    sort: '<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 4v16"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };
  function icon(name, cls) {
    return (
      '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[name] || "") + "</svg>"
    );
  }
  window.agoraIcon = icon;

  /* ---------------------- helpers ---------------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function lang() { return document.documentElement.getAttribute("data-lang") === "ru" ? "ru" : "en"; }
  function t(en, ru) { return lang() === "ru" ? ru : en; }
  window.agoraT = t;
  function bi(en, ru) { return 'data-en="' + esc(en) + '" data-ru="' + esc(ru) + '"'; }

  var PLATFORMS = {
    telegram: "Telegram", discord: "Discord", signal: "Signal", whatsapp: "WhatsApp",
    instagram: "Instagram", mastodon: "Mastodon", simplex: "SimpleX Chat", other: "Other"
  };
  function platformLabel(k) { return PLATFORMS[k] || "Other"; }

  function statusMeta(s) {
    switch (s) {
      case "ongoing": return { en: "Ongoing", ru: "Идёт сейчас", cls: "status-ongoing" };
      case "awaiting": return { en: "Awaiting", ru: "Ожидание", cls: "status-awaiting" };
      case "cancelled": return { en: "Cancelled", ru: "Отменён", cls: "status-cancelled" };
      case "looking":
      default: return { en: "Looking for participants", ru: "Ищем участников", cls: "status-looking" };
    }
  }
  function locationText(d) {
    if (d.locationType === "virtual") return { en: "Online", ru: "Онлайн" };
    if (d.locationType === "geo")
      return { en: "In person" + (d.geoLocation ? " · " + d.geoLocation : ""),
               ru: "Очно" + (d.geoLocation ? " · " + d.geoLocation : "") };
    return { en: "Location TBD", ru: "Место не задано" };
  }
  function participantsText(d) {
    if (d.status === "cancelled") return { en: "Cancelled", ru: "Отменён" };
    if (d.participantsMode === "limited" && d.participantsLimit)
      return { en: d.participants.length + " of " + d.participantsLimit + " joined",
               ru: d.participants.length + " из " + d.participantsLimit + " участников" };
    return { en: d.participants.length + " joined · open size", ru: d.participants.length + " уч. · размер не задан" };
  }
  function whenText(d) {
    var diff = Date.now() - d.createdAt, h = 36e5, day = 864e5;
    if (diff < h) return { en: "Opened just now", ru: "Только что открыт" };
    if (diff < day) { var n = Math.round(diff / h); return { en: "Opened " + n + "h ago", ru: "Открыт " + n + " ч назад" }; }
    var dd = Math.round(diff / day);
    if (dd < 7) return { en: "Opened " + dd + "d ago", ru: "Открыт " + dd + " дн назад" };
    var w = Math.round(dd / 7);
    return { en: "Opened " + w + "w ago", ru: "Открыт " + w + " нед назад" };
  }
  function avatarVariant(name) {
    var c = (name || "?").charCodeAt(0) % 4;
    return ["", " avatar--v1", " avatar--v2", " avatar--v3"][c];
  }

  function debateCardHTML(d) {
    var st = statusMeta(d.status), loc = locationText(d), pt = participantsText(d), wt = whenText(d);
    return (
      '<a class="debate-card" href="debate.html?id=' + encodeURIComponent(d.id) + '">' +
        '<div class="debate-card__top">' +
          '<span class="badge ' + st.cls + '" ' + bi(st.en, st.ru) + ">" + st.en + "</span>" +
          '<span class="badge badge--secondary badge--no-dot" ' + bi(loc.en, loc.ru) + ">" + esc(loc.en) + "</span>" +
        "</div>" +
        '<span class="debate-card__title">' + esc(d.topic) + "</span>" +
        '<div class="debate-card__meta">' +
          '<span data-icon="user"><span ' + bi("by " + d.authorUsername, "от " + d.authorUsername) + ">by " + esc(d.authorUsername) + "</span></span>" +
          '<span data-icon="users"><span ' + bi(pt.en, pt.ru) + ">" + esc(pt.en) + "</span></span>" +
          '<span data-icon="calendar"><span ' + bi(wt.en, wt.ru) + ">" + wt.en + "</span></span>" +
        "</div>" +
      "</a>"
    );
  }
  function userCardHTML(u) {
    var mono = (u.username[0] || "?").toUpperCase();
    return (
      '<a class="user-card" href="user.html?u=' + encodeURIComponent(u.username) + '">' +
        '<span class="avatar' + avatarVariant(u.username) + '">' + esc(mono) + "</span>" +
        '<span class="user-card__body">' +
          '<span class="user-card__name">' + esc(u.username) + "</span>" +
          (u.description ? '<span class="user-card__desc">' + esc(u.description) + "</span>" : "") +
        "</span>" +
        icon("chevron", "user-card__chevron") +
      "</a>"
    );
  }

  /* ---------------------- i18n ---------------------- */
  function applyI18n(l) {
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + l); if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-en-html]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-html"); if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-en-ph]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-ph"); if (v != null) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      var v = el.getAttribute("data-" + l + "-aria"); if (v != null) el.setAttribute("aria-label", v);
    });
  }
  function injectIcons(root) {
    (root || document).querySelectorAll("[data-icon]").forEach(function (el) {
      if (!el.querySelector("svg")) el.insertAdjacentHTML("afterbegin", icon(el.getAttribute("data-icon")));
    });
  }
  function localize() { applyI18n(lang()); injectIcons(); }

  /* ---------------------- theme + language ---------------------- */
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
  function setTheme(x) { document.documentElement.setAttribute("data-theme", x); localStorage.setItem(STORAGE.theme, x); syncToggles(); }
  function setLang(l) {
    var r = document.documentElement;
    r.setAttribute("data-lang", l); r.lang = l; localStorage.setItem(STORAGE.lang, l);
    applyI18n(l); syncToggles();
  }
  function syncToggles() {
    var th = document.documentElement.getAttribute("data-theme"), lg = document.documentElement.getAttribute("data-lang");
    document.querySelectorAll("[data-set-theme]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-theme") === th)); });
    document.querySelectorAll("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lg)); });
  }

  /* ---------------------- header / footer ---------------------- */
  var cfg = window.AGORA || {};
  var active = cfg.active || "";

  function session() {
    var u = window.Store ? Store.currentUser() : null;
    if (u) return { auth: "user", username: u.username };
    return { auth: cfg.auth === "user" ? "user" : "guest", username: cfg.username || "user" };
  }

  function themeLangControls() {
    return (
      '<div class="segmented" role="group" aria-label="Theme">' +
        '<button type="button" data-set-theme="light" title="Light">' + icon("sun") + "</button>" +
        '<button type="button" data-set-theme="dark" title="Dark">' + icon("moon") + "</button>" +
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
      return '<a href="' + href + '"' + cur + " " + bi(en, ru) + ">" + en + "</a>";
    }
    return link("debates.html", "debates", "Debates", "Дебаты") + link("users.html", "users", "Users", "Пользователи");
  }
  function accountArea(s, mobile) {
    if (s.auth === "user") {
      if (mobile) {
        return (
          '<a href="profile.html" ' + bi("My account", "Мой аккаунт") + ">My account</a>" +
          '<a href="my-debates.html" ' + bi("My debates", "Мои дебаты") + ">My debates</a>" +
          '<a href="#" data-action="logout" ' + bi("Log out", "Выйти") + ">Log out</a>"
        );
      }
      return (
        '<div class="dropdown">' +
          '<button class="btn btn--ghost" data-dropdown-toggle aria-expanded="false">' +
            '<span class="avatar avatar--sm' + avatarVariant(s.username) + '">' + esc((s.username[0] || "?").toUpperCase()) + "</span>" +
            '<span ' + bi("My account", "Мой аккаунт") + ">My account</span>" + icon("chevron") +
          "</button>" +
          '<div class="dropdown__menu" hidden>' +
            '<a class="dropdown__item" href="profile.html"><span ' + bi("Profile settings", "Настройки профиля") + ">Profile settings</span>" + icon("user") + "</a>" +
            '<a class="dropdown__item" href="my-debates.html"><span ' + bi("My debates", "Мои дебаты") + ">My debates</span>" + icon("grid") + "</a>" +
            '<div class="dropdown__sep"></div>' +
            '<a class="dropdown__item" href="#" data-action="logout"><span ' + bi("Log out", "Выйти") + ">Log out</span>" + icon("logout") + "</a>" +
          "</div>" +
        "</div>"
      );
    }
    return (
      '<a class="btn btn--ghost" href="login.html" ' + bi("Log in", "Войти") + ">Log in</a>" +
      '<a class="btn btn--primary" href="register.html" ' + bi("Register", "Регистрация") + ">Register</a>"
    );
  }
  function buildHeader() {
    var s = session();
    var createBtn = s.auth === "user"
      ? '<a class="btn btn--accent desktop-only" href="debate-config.html">' + icon("plus") + "<span " + bi("New debate", "Создать дебат") + ">New debate</span></a>" : "";
    var unread = window.Store && s.auth === "user" ? Store.unread() : 0;
    var bell = s.auth === "user"
      ? '<a class="icon-btn ' + (unread > 0 ? "has-badge" : "") + '" href="notifications.html" data-en-aria="Notifications" data-ru-aria="Уведомления">' + icon("bell") + "</a>" : "";
    return (
      '<header class="site-header"><div class="container"><div class="site-header__inner">' +
        '<a class="brand" href="index.html"><span class="brand__mark">A</span><span>Agora</span></a>' +
        '<nav class="main-nav" aria-label="Primary">' + navLinks() + "</nav>" +
        '<div class="header-spacer"></div>' +
        '<div class="header-actions">' +
          createBtn +
          '<span class="desktop-only">' + themeLangControls() + "</span>" +
          bell +
          '<span class="desktop-only">' + accountArea(s, false) + "</span>" +
          '<button class="icon-btn hamburger" data-toggle="mobile-menu" aria-expanded="false" data-en-aria="Open menu" data-ru-aria="Открыть меню">' + icon("menu") + "</button>" +
        "</div>" +
      "</div></div></header>" +
      '<div class="mobile-menu" id="mobile-menu" hidden>' +
        '<nav aria-label="Mobile">' + navLinks() +
          (s.auth === "user" ? '<a href="debate-config.html" ' + bi("New debate", "Создать дебат") + ">New debate</a>" : "") +
        "</nav>" +
        '<div class="menu-actions">' + accountArea(s, true) +
          '<div class="cluster" style="justify-content:space-between;margin-top:1rem">' + themeLangControls() + "</div>" +
        "</div>" +
      "</div>"
    );
  }
  function buildFooter() {
    // The "data lives in your browser" note + reset only make sense in demo mode.
    var proto = window.Store && Store.mode && Store.mode() === "demo"
      ? '<div class="site-footer__proto text-xs subtle">' +
          '<span ' + bi("Front-end prototype — your data is stored only in this browser.", "Фронтенд-прототип — данные хранятся только в этом браузере.") + ">Front-end prototype — your data is stored only in this browser.</span> " +
          '<button class="btn btn--link text-xs" data-action="reset-demo" ' + bi("Reset demo data", "Сбросить демо-данные") + ">Reset demo data</button>" +
        "</div>"
      : "";
    return (
      '<footer class="site-footer"><div class="container">' +
        '<div class="site-footer__inner">' +
          '<div><span data-en-html="Developed by SPOF Code · Design by Agora" data-ru-html="Разработка — SPOF Code · Дизайн — Agora">Developed by SPOF Code · Design by Agora</span></div>' +
          "<div>© SPOF Code. All rights reserved. 2026</div>" +
        "</div>" + proto +
      "</div></footer>"
    );
  }

  /* ---------------------- form helpers ---------------------- */
  function fieldOf(el) { return el.closest ? el.closest(".field") : null; }
  function setFieldError(input, msg) {
    var f = fieldOf(input); if (!f) return;
    f.classList.add("field--invalid");
    var e = f.querySelector(".field-error");
    if (!e) { e = document.createElement("p"); e.className = "field-error"; f.appendChild(e); }
    if (msg && typeof msg === "object") { e.setAttribute("data-en", msg.en); e.setAttribute("data-ru", msg.ru); e.textContent = t(msg.en, msg.ru); }
    else { e.textContent = msg || ""; }
  }
  function clearFieldError(input) {
    var f = fieldOf(input); if (!f) return;
    f.classList.remove("field--invalid");
    var e = f.querySelector(".field-error"); if (e) e.remove();
  }
  function toast(msg, kind) {
    var wrap = document.getElementById("toast-wrap");
    if (!wrap) { wrap = document.createElement("div"); wrap.id = "toast-wrap"; wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
    var el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.innerHTML = (kind === "success" ? icon("check") : kind === "danger" ? icon("alert") : icon("info")) + "<span>" + esc(msg) + "</span>";
    wrap.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }
  function requireAuth() {
    if (window.Store && Store.currentUser()) return Store.currentUser();
    var here = location.pathname.split("/").pop() + location.search;
    location.replace("login.html?next=" + encodeURIComponent(here));
    return null;
  }
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /* ---------------------- widgets ---------------------- */
  // Contact platform widget row
  function contactRow(c) {
    c = c || { platform: "telegram", identifier: "", description: "", hidden: false };
    var opts = Object.keys(PLATFORMS).map(function (k) {
      return '<option value="' + k + '"' + (c.platform === k ? " selected" : "") + ">" + PLATFORMS[k] + "</option>";
    }).join("");
    return (
      '<div class="widget-row' + (c.hidden ? " widget-row--hidden" : "") + '" data-widget="contact">' +
        '<div class="widget-row__grid">' +
          '<div class="field"><select class="select js-platform">' + opts + "</select></div>" +
          '<div class="field"><input class="input js-identifier" value="' + esc(c.identifier) + '" data-en-ph="Contact (e.g. @username)" data-ru-ph="Контакт (напр. @username)"></div>' +
        "</div>" +
        '<div class="field"><input class="input js-desc" value="' + esc(c.description || "") + '" data-en-ph="Description (optional)" data-ru-ph="Описание (необязательно)"></div>' +
        '<div class="widget-row__controls">' +
          '<div class="widget-row__reorder">' +
            '<button type="button" class="icon-btn icon-btn--sm icon-btn--bordered" data-widget-move="up" data-en-aria="Move up" data-ru-aria="Вверх">' + icon("up") + "</button>" +
            '<button type="button" class="icon-btn icon-btn--sm icon-btn--bordered" data-widget-move="down" data-en-aria="Move down" data-ru-aria="Вниз">' + icon("down") + "</button>" +
          "</div>" +
          '<label class="switch"><input type="checkbox" class="js-hidden"' + (c.hidden ? "" : " checked") + '><span class="track"></span>' +
            '<span class="text-xs muted" ' + bi(c.hidden ? "Hidden" : "Shown", c.hidden ? "Скрыт" : "Показан") + ">" + (c.hidden ? "Hidden" : "Shown") + "</span></label>" +
          '<span class="widget-row__spacer"></span>' +
          '<button type="button" class="icon-btn icon-btn--sm icon-btn--danger" data-widget-remove data-en-aria="Remove" data-ru-aria="Удалить">' + icon("x") + "</button>" +
        "</div>" +
      "</div>"
    );
  }
  // Virtual location widget row
  function virtualRow(v) {
    v = v || { platform: "simplex", participantLink: "", viewerLink: "", description: "", hidden: false };
    var vp = { simplex: "SimpleX Chat", telegram: "Telegram", discord: "Discord", instagram: "Instagram", other: "Other" };
    var opts = Object.keys(vp).map(function (k) {
      return '<option value="' + k + '"' + (v.platform === k ? " selected" : "") + ">" + vp[k] + "</option>";
    }).join("");
    return (
      '<div class="widget-row' + (v.hidden ? " widget-row--hidden" : "") + '" data-widget="virtual">' +
        '<div class="field"><select class="select js-platform">' + opts + "</select></div>" +
        '<div class="widget-row__grid">' +
          '<div class="field"><input class="input js-plink" value="' + esc(v.participantLink) + '" data-en-ph="Link for participants" data-ru-ph="Ссылка для участников"></div>' +
          '<div class="field"><input class="input js-vlink" value="' + esc(v.viewerLink) + '" data-en-ph="Link for viewers" data-ru-ph="Ссылка для зрителей"></div>' +
        "</div>" +
        '<div class="field"><input class="input js-desc" value="' + esc(v.description || "") + '" data-en-ph="Platform description (optional)" data-ru-ph="Описание площадки (необязательно)"></div>' +
        '<div class="widget-row__controls">' +
          '<div class="widget-row__reorder">' +
            '<button type="button" class="icon-btn icon-btn--sm icon-btn--bordered" data-widget-move="up" data-en-aria="Move up" data-ru-aria="Вверх">' + icon("up") + "</button>" +
            '<button type="button" class="icon-btn icon-btn--sm icon-btn--bordered" data-widget-move="down" data-en-aria="Move down" data-ru-aria="Вниз">' + icon("down") + "</button>" +
          "</div>" +
          '<label class="switch"><input type="checkbox" class="js-hidden"' + (v.hidden ? "" : " checked") + '><span class="track"></span>' +
            '<span class="text-xs muted" ' + bi(v.hidden ? "Hidden" : "Shown", v.hidden ? "Скрыт" : "Показан") + ">" + (v.hidden ? "Hidden" : "Shown") + "</span></label>" +
          '<span class="widget-row__spacer"></span>' +
          '<button type="button" class="icon-btn icon-btn--sm icon-btn--danger" data-widget-remove data-en-aria="Remove" data-ru-aria="Удалить">' + icon("x") + "</button>" +
        "</div>" +
      "</div>"
    );
  }
  function readContacts(container) {
    return Array.prototype.map.call(container.querySelectorAll('[data-widget="contact"]'), function (row) {
      return {
        platform: row.querySelector(".js-platform").value,
        identifier: row.querySelector(".js-identifier").value.trim(),
        description: row.querySelector(".js-desc").value.trim(),
        hidden: !row.querySelector(".js-hidden").checked,
      };
    }).filter(function (c) { return c.identifier; });
  }
  function readVirtual(container) {
    return Array.prototype.map.call(container.querySelectorAll('[data-widget="virtual"]'), function (row) {
      return {
        platform: row.querySelector(".js-platform").value,
        participantLink: row.querySelector(".js-plink").value.trim(),
        viewerLink: row.querySelector(".js-vlink").value.trim(),
        description: row.querySelector(".js-desc").value.trim(),
        hidden: !row.querySelector(".js-hidden").checked,
      };
    }).filter(function (v) { return v.participantLink || v.viewerLink; });
  }

  /* ---------------------- wiring ---------------------- */
  function closeDropdowns(except) {
    document.querySelectorAll(".dropdown__menu").forEach(function (m) {
      if (m !== except) { m.hidden = true; var tg = m.parentElement.querySelector("[data-dropdown-toggle]"); if (tg) tg.setAttribute("aria-expanded", "false"); }
    });
  }
  function wire() {
    document.addEventListener("click", function (e) {
      var el;
      if ((el = e.target.closest("[data-set-theme]"))) { setTheme(el.getAttribute("data-set-theme")); return; }
      if ((el = e.target.closest("[data-set-lang]"))) { setLang(el.getAttribute("data-set-lang")); return; }

      if ((el = e.target.closest('[data-action="logout"]'))) {
        e.preventDefault();
        Promise.resolve(window.Store && Store.logout()).then(function () { location.href = "index.html"; });
        return;
      }
      if ((el = e.target.closest('[data-action="reset-demo"]'))) {
        e.preventDefault();
        Promise.resolve(window.Store && Store.resetDemo()).then(function () { location.reload(); });
        return;
      }
      if ((el = e.target.closest("[data-toggle-password]"))) {
        var inp = document.getElementById(el.getAttribute("data-toggle-password"));
        if (inp) {
          var show = inp.type === "password";
          inp.type = show ? "text" : "password";
          el.innerHTML = icon(show ? "eyeOff" : "eye");
          el.setAttribute("aria-label", show ? t("Hide password", "Скрыть пароль") : t("Show password", "Показать пароль"));
        }
        return;
      }

      if ((el = e.target.closest('[data-toggle="mobile-menu"]'))) {
        var menu = document.getElementById("mobile-menu"), open = menu.hidden;
        menu.hidden = !open; el.setAttribute("aria-expanded", String(open)); el.innerHTML = icon(open ? "x" : "menu"); return;
      }
      if ((el = e.target.closest('[data-toggle="filters"]'))) {
        var panel = document.getElementById(el.getAttribute("data-target") || "filters-panel");
        if (panel) { var o = panel.hidden; panel.hidden = !o; el.setAttribute("aria-expanded", String(o)); } return;
      }
      if ((el = e.target.closest("[data-dropdown-toggle]"))) {
        var dm = el.parentElement.querySelector(".dropdown__menu"), willOpen = dm.hidden;
        closeDropdowns(willOpen ? dm : null); dm.hidden = !willOpen; el.setAttribute("aria-expanded", String(willOpen)); return;
      }

      // widget: move / remove
      if ((el = e.target.closest("[data-widget-move]"))) {
        var row = el.closest(".widget-row"), dir = el.getAttribute("data-widget-move");
        if (dir === "up" && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
        if (dir === "down" && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
        return;
      }
      if ((el = e.target.closest("[data-widget-remove]"))) { el.closest(".widget-row").remove(); return; }

      // dialogs
      if ((el = e.target.closest("[data-open-dialog]"))) {
        e.preventDefault(); var d = document.getElementById(el.getAttribute("data-open-dialog"));
        if (d) { d.hidden = false; document.body.style.overflow = "hidden"; } return;
      }
      if ((el = e.target.closest("[data-close-dialog]"))) {
        var back = el.closest(".dialog-backdrop"); if (back) { back.hidden = true; document.body.style.overflow = ""; } return;
      }
      if (e.target.classList && e.target.classList.contains("dialog-backdrop")) {
        e.target.hidden = true; document.body.style.overflow = ""; return;
      }

      if (!e.target.closest(".dropdown")) closeDropdowns(null);
    });

    // Toggle switch label text (Shown/Hidden) live
    document.addEventListener("change", function (e) {
      var sw = e.target.closest(".switch");
      if (sw && e.target.classList.contains("js-hidden")) {
        var lbl = sw.querySelector("span.text-xs");
        var on = e.target.checked;
        lbl.setAttribute("data-en", on ? "Shown" : "Hidden");
        lbl.setAttribute("data-ru", on ? "Показан" : "Скрыт");
        lbl.textContent = t(on ? "Shown" : "Hidden", on ? "Показан" : "Скрыт");
        var row = sw.closest(".widget-row");
        if (row) row.classList.toggle("widget-row--hidden", !on);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeDropdowns(null);
        document.querySelectorAll(".dialog-backdrop:not([hidden])").forEach(function (b) { b.hidden = true; document.body.style.overflow = ""; });
      }
    });
  }

  /* ---------------------- public API ---------------------- */
  window.Agora = {
    icon: icon, esc: esc, t: t, lang: lang, bi: bi,
    localize: localize, injectIcons: injectIcons,
    platformLabel: platformLabel, statusMeta: statusMeta, locationText: locationText,
    participantsText: participantsText, whenText: whenText, avatarVariant: avatarVariant,
    debateCardHTML: debateCardHTML, userCardHTML: userCardHTML,
    setFieldError: setFieldError, clearFieldError: clearFieldError, toast: toast,
    requireAuth: requireAuth, qs: qs,
    contactRow: contactRow, virtualRow: virtualRow, readContacts: readContacts, readVirtual: readVirtual,
  };

  /* ---------------------- boot ---------------------- */
  async function boot() {
    try { if (window.Store) await Store.init(); } catch (err) { console.error(err); }
    var h = document.getElementById("site-header"); if (h) h.outerHTML = buildHeader();
    var f = document.getElementById("site-footer"); if (f) f.outerHTML = buildFooter();
    setLang(initialLang()); setTheme(initialTheme());
    injectIcons();
    wire();
    if (typeof window.agoraPage === "function") {
      try { await window.agoraPage(); } catch (err) { console.error(err); }
    }
    applyI18n(lang()); injectIcons(); // localize anything the page rendered
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
