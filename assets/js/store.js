/* ==========================================================================
   Agora — store.js  (dual-mode async data layer)
   • If a backend API is reachable (served by the Node server) -> "api" mode:
     real accounts, shared multi-user data, sessions (httpOnly cookie).
   • Otherwise (opened as a static file / GitHub Pages) -> "demo" mode:
     everything lives in this browser's localStorage. Great for a preview.
   Every data method returns a Promise. The current user is cached
   synchronously (Store.currentUser()) after Store.init() resolves.
   ========================================================================== */
window.Store = (function () {
  "use strict";

  var USERNAME_RE = /^[A-Za-z0-9_.-]+$/, PW_MIN = 8, PW_MAX = 64;
  var mode = "demo";
  var cache = { user: null, unread: 0 };

  /* ============================ shared validators ============================ */
  function validateUsername(name) {
    name = (name || "").trim();
    if (!name) return { en: "Username is required", ru: "Введите имя пользователя" };
    if (!USERNAME_RE.test(name)) return { en: "Username contains forbidden symbols", ru: "Имя содержит запрещённые символы" };
    return null;
  }
  function validatePassword(pw) {
    pw = pw || "";
    if (pw.length < PW_MIN) return { en: "Your password is too short. Please, think of a longer password.", ru: "Пароль слишком короткий. Придумайте длиннее." };
    if (pw.length > PW_MAX) return { en: "Password is too long.", ru: "Пароль слишком длинный." };
    return null;
  }
  function publicContacts(user) { return user ? (user.contacts || []).filter(function (c) { return !c.hidden; }) : []; }

  /* ============================ API backend ============================ */
  async function api(method, p, body) {
    var opts = { method: method, credentials: "same-origin", headers: {} };
    if (body !== undefined) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    var r = await fetch(p, opts);
    var j = {}; try { j = await r.json(); } catch (e) {}
    return { status: r.status, ok: r.ok, body: j || {} };
  }
  function qs(obj) {
    var parts = [];
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
      parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(Array.isArray(v) ? v.join(",") : v));
    });
    return parts.length ? "?" + parts.join("&") : "";
  }

  var API = {
    async init() {
      var r = await api("GET", "/api/me");
      cache.user = r.body.user || null;
      cache.unread = r.body.unread || 0;
    },
    async register(d) { var r = await api("POST", "/api/register", d); if (r.body.ok) { cache.user = r.body.user; cache.unread = 0; } return r.body; },
    async login(u, p) { var r = await api("POST", "/api/login", { username: u, password: p }); if (r.body.ok) { cache.user = r.body.user; } return r.body; },
    async logout() { await api("POST", "/api/logout"); cache.user = null; cache.unread = 0; },
    async getUsers(o) { o = o || {}; var r = await api("GET", "/api/users" + qs({ query: o.query, sort: o.sort })); return r.body.users || []; },
    async getUser(name) { var r = await api("GET", "/api/users/" + encodeURIComponent(name)); return r.body.user || null; },
    async getDebate(id) { var r = await api("GET", "/api/debates/" + encodeURIComponent(id)); return r.body.debate || null; },
    async getDebates(o) { o = o || {}; var r = await api("GET", "/api/debates" + qs(o)); return r.body.debates || []; },
    async createDebate(d) { return (await api("POST", "/api/debates", d)).body; },
    async updateDebate(id, d) { return (await api("PATCH", "/api/debates/" + encodeURIComponent(id), d)).body; },
    async deleteDebate(id) { return (await api("DELETE", "/api/debates/" + encodeURIComponent(id))).body; },
    async participate(id) { return (await api("POST", "/api/debates/" + encodeURIComponent(id) + "/participate")).body; },
    async withdraw(id) { return (await api("POST", "/api/debates/" + encodeURIComponent(id) + "/withdraw")).body; },
    async updateProfile(patch) { var r = await api("PATCH", "/api/me", patch); if (r.body.user) cache.user = r.body.user; return r.body; },
    async changeUsername(name) { var r = await api("POST", "/api/me/username", { username: name }); if (r.body.ok && cache.user) cache.user.username = r.body.username; return r.body; },
    async changePassword(cur, next) { return (await api("POST", "/api/me/password", { current: cur, next: next })).body; },
    async deleteAccount(pw) { var r = await api("DELETE", "/api/me", { password: pw }); if (r.body.ok) cache.user = null; return r.body; },
    async addReport(r) { return (await api("POST", "/api/reports", r)).body; },
    async getNotifications() { var r = await api("GET", "/api/notifications"); cache.unread = r.body.unread || 0; return r.body.items || []; },
    async markNotificationsRead() { await api("POST", "/api/notifications/read"); cache.unread = 0; },
    async resetDemo() { /* no-op in api mode */ },
  };

  /* ============================ DEMO backend (localStorage) ============================ */
  var KEY = "agora-db-v1";
  var demoDb = null;
  function dLoad() { try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) {} return null; }
  function dSave() { localStorage.setItem(KEY, JSON.stringify(demoDb)); }
  function dSeed() {
    var now = Date.now(), day = 86400000;
    function u(username, description, contacts) { return { username: username, password: "password123", description: description || "", email: "", phone: "", contacts: contacts || [], createdAt: now - 30 * day }; }
    var users = [
      u("sofia", "Debate organiser and moderator. I care about clear arguments and good faith. Ask me about ethics, tech policy and city life.", [
        { platform: "telegram", identifier: "@sofia_debates", description: "Fastest way to reach me", hidden: false },
        { platform: "signal", identifier: "sofia.99", description: "", hidden: false },
        { platform: "discord", identifier: "sofia#2201", description: "For group calls", hidden: true }]),
      u("maria_v", "Art historian. Interested in the boundary between craft and technology.", [{ platform: "instagram", identifier: "@maria.v.art", description: "", hidden: false }]),
      u("t.hoffmann", "Small-business owner from Berlin. Pragmatic optimist.", [{ platform: "whatsapp", identifier: "+49 151 000000", description: "", hidden: false }]),
      u("devon.k", "Public-sector software engineer. Open-source advocate.", [{ platform: "mastodon", identifier: "@devon@fosstodon.org", description: "", hidden: false }]),
      u("lucie", "Urbanist. Prague. Cars are guests in the city, not owners.", []),
      u("arjun_p", "Economics student. I change my mind when the evidence is good.", []),
    ];
    var debates = [
      { id: "d1", topic: "Should AI-generated art be eligible for traditional art prizes?", status: "looking", participantsMode: "limited", participantsLimit: 6, dateTimeHeld: "", publicity: "public", locationType: "virtual", geoLocation: "", virtualPlatforms: [{ platform: "discord", participantLink: "https://discord.gg/example", viewerLink: "https://youtube.com/@example", description: "Main stage", hidden: false }], description: "A structured debate on whether works produced with generative models belong in the same category as hand-made pieces. Two sides, three rounds, moderated.", authorUsername: "maria_v", participants: ["arjun_p", "lucie", "devon.k", "t.hoffmann"], createdAt: now - 2 * day },
      { id: "d2", topic: "Is a four-day work week realistic for small businesses?", status: "awaiting", participantsMode: "undetermined", participantsLimit: null, dateTimeHeld: "2026-07-18T19:00", publicity: "public", locationType: "geo", geoLocation: "Café Central, Berlin", virtualPlatforms: [], description: "In-person round table. Bring your own numbers.", authorUsername: "t.hoffmann", participants: ["sofia"], createdAt: now - 4 * day },
      { id: "d3", topic: "Open-source vs. proprietary software in public institutions", status: "ongoing", participantsMode: "limited", participantsLimit: 8, dateTimeHeld: "", publicity: "public", locationType: "virtual", geoLocation: "", virtualPlatforms: [{ platform: "telegram", participantLink: "https://t.me/example", viewerLink: "https://t.me/example_view", description: "", hidden: false }], description: "Live now. Viewers welcome.", authorUsername: "devon.k", participants: ["sofia", "maria_v", "lucie", "arjun_p", "t.hoffmann"], createdAt: now - 6 * day },
      { id: "d4", topic: "Should city centres be car-free by 2030?", status: "looking", participantsMode: "limited", participantsLimit: 10, dateTimeHeld: "2026-08-02T17:30", publicity: "public", locationType: "geo", geoLocation: "Náměstí Míru, Prague", virtualPlatforms: [], description: "Public square meet-up. Family friendly.", authorUsername: "lucie", participants: ["sofia", "arjun_p"], createdAt: now - 5 * day },
      { id: "d5", topic: "Universal basic income: safety net or moral hazard?", status: "cancelled", participantsMode: "undetermined", participantsLimit: null, dateTimeHeld: "", publicity: "public", locationType: "undetermined", geoLocation: "", virtualPlatforms: [], description: "Cancelled — will re-open later in the year.", authorUsername: "arjun_p", participants: [], createdAt: now - 8 * day },
      { id: "d6", topic: "Are ranked-choice ballots better for local elections?", status: "looking", participantsMode: "limited", participantsLimit: 4, dateTimeHeld: "", publicity: "public", locationType: "virtual", geoLocation: "", virtualPlatforms: [{ platform: "simplex", participantLink: "https://simplex.chat/invite/example", viewerLink: "", description: "Private link on request", hidden: false }], description: "Small, focused, four people. Preparation notes shared beforehand.", authorUsername: "sofia", participants: ["maria_v"], createdAt: now - 1 * day },
    ];
    var notifications = [
      { id: "n1", username: "sofia", text: "arjun_p joined your debate “Are ranked-choice ballots better for local elections?”", read: false, createdAt: now - 3600000 },
      { id: "n2", username: "sofia", text: "maria_v joined your debate “Are ranked-choice ballots better for local elections?”", read: false, createdAt: now - 7200000 },
      { id: "n3", username: "sofia", text: "Your debate “Open-source vs. proprietary software” is now ongoing.", read: true, createdAt: now - day },
    ];
    return { users: users, debates: debates, reports: [], notifications: notifications, session: "sofia", seq: 100 };
  }
  function dInit() { demoDb = dLoad(); if (!demoDb) { demoDb = dSeed(); dSave(); } cache.user = dUser(demoDb.session); cache.unread = dUnread(demoDb.session); }
  function dUser(name) { return demoDb.users.find(function (u) { return u.username === name; }) || null; }
  function dNextId(p) { demoDb.seq = (demoDb.seq || 100) + 1; return p + demoDb.seq; }
  function dUnread(name) { return demoDb.notifications.filter(function (n) { return n.username === name && !n.read; }).length; }
  function dVisible(d, viewer) { if (d.publicity === "private" && d.status === "ongoing") return viewer && viewer === d.authorUsername; return true; }

  var DEMO = {
    async init() { dInit(); },
    async register(data) {
      var e = validateUsername(data.username); if (e) return { ok: false, field: "username", error: e };
      if (dUser(data.username.trim())) return { ok: false, field: "username", error: { en: "This username is already taken", ru: "Это имя уже занято" } };
      e = validatePassword(data.password); if (e) return { ok: false, field: "password", error: e };
      var user = { username: data.username.trim(), password: data.password, description: "", email: "", phone: "", contacts: [], createdAt: Date.now() };
      demoDb.users.push(user); demoDb.session = user.username; dSave(); cache.user = user; cache.unread = 0;
      return { ok: true, user: user };
    },
    async login(username, password) {
      var u = dUser((username || "").trim());
      if (!u || u.password !== password) return { ok: false, error: { en: "Error: Login failed. Either the username does not exist, or the password is wrong.", ru: "Ошибка: вход не выполнен. Либо имя не существует, либо пароль неверный." } };
      demoDb.session = u.username; dSave(); cache.user = u; cache.unread = dUnread(u.username);
      return { ok: true, user: u };
    },
    async logout() { demoDb.session = null; dSave(); cache.user = null; cache.unread = 0; },
    async getUsers(opts) {
      opts = opts || {}; var list = demoDb.users.slice();
      if (opts.query) { var q = opts.query.toLowerCase(); list = list.filter(function (u) { return u.username.toLowerCase().indexOf(q) >= 0; }); }
      var dir = opts.sort === "za" ? -1 : 1; list.sort(function (a, b) { return a.username.localeCompare(b.username) * dir; });
      return list;
    },
    async getUser(name) { return dUser(name); },
    async getDebate(id) { return demoDb.debates.find(function (d) { return d.id === id; }) || null; },
    async getDebates(opts) {
      opts = opts || {}; var viewer = demoDb.session;
      var list = demoDb.debates.filter(function (d) { return dVisible(d, viewer); });
      if (opts.author) list = list.filter(function (d) { return d.authorUsername === opts.author; });
      if (opts.participant) list = list.filter(function (d) { return d.participants.indexOf(opts.participant) >= 0; });
      if (opts.query) { var q = opts.query.toLowerCase(); list = list.filter(function (d) { return d.topic.toLowerCase().indexOf(q) >= 0; }); }
      if (opts.publishedBy && opts.publishedBy.length) { var n = opts.publishedBy.map(function (x) { return x.toLowerCase(); }); list = list.filter(function (d) { return n.indexOf(d.authorUsername.toLowerCase()) >= 0; }); }
      if (opts.statuses && opts.statuses.length) list = list.filter(function (d) { return opts.statuses.indexOf(d.status) >= 0; });
      var sort = opts.sort || "pub-new";
      list.sort(function (a, b) {
        switch (sort) {
          case "name-az": return a.topic.localeCompare(b.topic);
          case "name-za": return b.topic.localeCompare(a.topic);
          case "pub-old": return a.createdAt - b.createdAt;
          case "held-early": return (a.dateTimeHeld || "9") > (b.dateTimeHeld || "9") ? 1 : -1;
          case "held-late": return (a.dateTimeHeld || "0") < (b.dateTimeHeld || "0") ? 1 : -1;
          default: return b.createdAt - a.createdAt;
        }
      });
      if (opts.limit) list = list.slice(0, opts.limit);
      return list;
    },
    async createDebate(data) {
      var u = cache.user; if (!u) return { ok: false };
      var d = Object.assign({ id: dNextId("d"), topic: "", status: "looking", participantsMode: "undetermined", participantsLimit: null, dateTimeHeld: "", publicity: "undetermined", locationType: "undetermined", geoLocation: "", virtualPlatforms: [], description: "", authorUsername: u.username, participants: [], createdAt: Date.now() }, data);
      demoDb.debates.push(d); dSave(); return { ok: true, debate: d };
    },
    async updateDebate(id, data) { var d = await DEMO.getDebate(id); if (!d) return { ok: false }; Object.assign(d, data); dSave(); return { ok: true, debate: d }; },
    async deleteDebate(id) { demoDb.debates = demoDb.debates.filter(function (d) { return d.id !== id; }); dSave(); return { ok: true }; },
    async participate(id) { var u = cache.user, d = await DEMO.getDebate(id); if (!u || !d) return { ok: false }; if (d.participants.indexOf(u.username) < 0) d.participants.push(u.username); dSave(); return { ok: true }; },
    async withdraw(id) { var u = cache.user, d = await DEMO.getDebate(id); if (!u || !d) return { ok: false }; d.participants = d.participants.filter(function (p) { return p !== u.username; }); dSave(); return { ok: true }; },
    async updateProfile(patch) { var u = cache.user; if (!u) return { ok: false }; Object.assign(u, patch); dSave(); return { ok: true, user: u }; },
    async changeUsername(newName) {
      var u = cache.user; if (!u) return { ok: false };
      var e = validateUsername(newName); if (e) return { ok: false, error: e };
      newName = newName.trim();
      if (newName !== u.username && dUser(newName)) return { ok: false, error: { en: "This username is already taken", ru: "Это имя уже занято" } };
      var old = u.username; u.username = newName;
      demoDb.debates.forEach(function (d) { if (d.authorUsername === old) d.authorUsername = newName; d.participants = d.participants.map(function (p) { return p === old ? newName : p; }); });
      demoDb.notifications.forEach(function (n) { if (n.username === old) n.username = newName; });
      demoDb.session = newName; dSave(); return { ok: true, username: newName };
    },
    async changePassword(current, next) {
      var u = cache.user; if (!u) return { ok: false };
      if (u.password !== current) return { ok: false, field: "current", error: { en: "Current password is wrong", ru: "Текущий пароль неверный" } };
      var e = validatePassword(next); if (e) return { ok: false, field: "next", error: e };
      u.password = next; dSave(); return { ok: true };
    },
    async deleteAccount(password) {
      var u = cache.user; if (!u) return { ok: false };
      if (u.password !== password) return { ok: false, error: { en: "Password is wrong", ru: "Пароль неверный" } };
      var name = u.username;
      demoDb.users = demoDb.users.filter(function (x) { return x.username !== name; });
      demoDb.debates = demoDb.debates.filter(function (d) { return d.authorUsername !== name; });
      demoDb.debates.forEach(function (d) { d.participants = d.participants.filter(function (p) { return p !== name; }); });
      demoDb.notifications = demoDb.notifications.filter(function (n) { return n.username !== name; });
      demoDb.session = null; dSave(); cache.user = null; return { ok: true, username: name };
    },
    async addReport(r) { r.id = dNextId("r"); r.createdAt = Date.now(); r.byUsername = demoDb.session || null; demoDb.reports.push(r); dSave(); return { ok: true }; },
    async getNotifications() {
      var name = demoDb.session;
      return demoDb.notifications.filter(function (n) { return n.username === name; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    },
    async markNotificationsRead() { var name = demoDb.session; demoDb.notifications.forEach(function (n) { if (n.username === name) n.read = true; }); dSave(); cache.unread = 0; },
    async resetDemo() { demoDb = dSeed(); dSave(); },
  };

  /* ============================ mode selection ============================ */
  var B = DEMO;
  async function init() {
    // Skip the API probe where we know there is no backend (local file, or the
    // static GitHub Pages demo) so the console stays clean. Everywhere else,
    // probe: if a backend answers, use it; otherwise fall back to demo.
    var host = location.hostname || "";
    var forceDemo = location.protocol === "file:" || /(^|\.)github\.io$/i.test(host);
    if (!forceDemo) {
      try {
        var r = await fetch("/api/me", { credentials: "same-origin" });
        if (r.ok) {
          var j = await r.json();
          if (j && Object.prototype.hasOwnProperty.call(j, "user")) {
            mode = "api"; B = API; cache.user = j.user || null; cache.unread = j.unread || 0; return;
          }
        }
      } catch (e) {}
    }
    mode = "demo"; B = DEMO; await DEMO.init();
  }

  /* ============================ public (async) surface ============================ */
  return {
    init: init,
    mode: function () { return mode; },
    currentUser: function () { return cache.user; },
    unread: function () { return cache.unread; },
    validateUsername: validateUsername, validatePassword: validatePassword, publicContacts: publicContacts,
    register: function (d) { return B.register(d); },
    login: function (u, p) { return B.login(u, p); },
    logout: function () { return B.logout(); },
    getUsers: function (o) { return B.getUsers(o); },
    getUser: function (n) { return B.getUser(n); },
    getDebate: function (id) { return B.getDebate(id); },
    getDebates: function (o) { return B.getDebates(o); },
    createDebate: function (d) { return B.createDebate(d); },
    updateDebate: function (id, d) { return B.updateDebate(id, d); },
    deleteDebate: function (id) { return B.deleteDebate(id); },
    participate: function (id) { return B.participate(id); },
    withdraw: function (id) { return B.withdraw(id); },
    updateProfile: function (p) { return B.updateProfile(p); },
    changeUsername: function (n) { return B.changeUsername(n); },
    changePassword: function (c, n) { return B.changePassword(c, n); },
    deleteAccount: function (p) { return B.deleteAccount(p); },
    addReport: function (r) { return B.addReport(r); },
    getNotifications: function () { return B.getNotifications(); },
    markNotificationsRead: function () { return B.markNotificationsRead(); },
    resetDemo: function () { return B.resetDemo(); },
  };
})();
