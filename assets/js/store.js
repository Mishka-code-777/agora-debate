/* ==========================================================================
   Agora — store.js
   Client-side data layer (localStorage). This is a FRONT-END PROTOTYPE:
   there is no server. Accounts, debates, sessions etc. are stored in the
   visitor's own browser. Passwords are kept in plain text for the demo only
   — this is NOT how a real product would work.
   ========================================================================== */
window.Store = (function () {
  "use strict";

  var KEY = "agora-db-v1";
  var USERNAME_RE = /^[A-Za-z0-9_.-]+$/;
  var PW_MIN = 8;
  var PW_MAX = 64;

  /* ---------------------- persistence ---------------------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function save(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  var db = load();
  if (!db) {
    db = seed();
    save(db);
  }

  function commit() {
    save(db);
  }

  /* ---------------------- seed ---------------------- */
  function seed() {
    var now = Date.now();
    var day = 86400000;
    function u(username, description, contacts, extra) {
      return Object.assign(
        {
          username: username,
          password: "password123",
          description: description || "",
          email: "",
          phone: "",
          contacts: contacts || [],
          createdAt: now - 30 * day,
        },
        extra || {}
      );
    }
    var users = [
      u(
        "sofia",
        "Debate organiser and moderator. I care about clear arguments and good faith. Ask me about ethics, tech policy and city life.",
        [
          { platform: "telegram", identifier: "@sofia_debates", description: "Fastest way to reach me", hidden: false },
          { platform: "signal", identifier: "sofia.99", description: "", hidden: false },
          { platform: "discord", identifier: "sofia#2201", description: "For group calls", hidden: true },
        ]
      ),
      u("maria_v", "Art historian. Interested in the boundary between craft and technology.", [
        { platform: "instagram", identifier: "@maria.v.art", description: "", hidden: false },
      ]),
      u("t.hoffmann", "Small-business owner from Berlin. Pragmatic optimist.", [
        { platform: "whatsapp", identifier: "+49 151 000000", description: "", hidden: false },
      ]),
      u("devon.k", "Public-sector software engineer. Open-source advocate.", [
        { platform: "mastodon", identifier: "@devon@fosstodon.org", description: "", hidden: false },
      ]),
      u("lucie", "Urbanist. Prague. Cars are guests in the city, not owners.", []),
      u("arjun_p", "Economics student. I change my mind when the evidence is good.", []),
    ];

    var debates = [
      {
        id: "d1",
        topic: "Should AI-generated art be eligible for traditional art prizes?",
        status: "looking",
        participantsMode: "limited",
        participantsLimit: 6,
        dateTimeHeld: "",
        publicity: "public",
        locationType: "virtual",
        geoLocation: "",
        virtualPlatforms: [
          { platform: "discord", participantLink: "https://discord.gg/example", viewerLink: "https://youtube.com/@example", description: "Main stage", hidden: false },
        ],
        description:
          "A structured debate on whether works produced with generative models belong in the same category as hand-made pieces. Two sides, three rounds, moderated.",
        authorUsername: "maria_v",
        participants: ["arjun_p", "lucie", "devon.k", "t.hoffmann"],
        createdAt: now - 2 * day,
      },
      {
        id: "d2",
        topic: "Is a four-day work week realistic for small businesses?",
        status: "awaiting",
        participantsMode: "undetermined",
        participantsLimit: null,
        dateTimeHeld: "2026-07-18T19:00",
        publicity: "public",
        locationType: "geo",
        geoLocation: "Café Central, Berlin",
        virtualPlatforms: [],
        description: "In-person round table. Bring your own numbers.",
        authorUsername: "t.hoffmann",
        participants: ["sofia"],
        createdAt: now - 4 * day,
      },
      {
        id: "d3",
        topic: "Open-source vs. proprietary software in public institutions",
        status: "ongoing",
        participantsMode: "limited",
        participantsLimit: 8,
        dateTimeHeld: "",
        publicity: "public",
        locationType: "virtual",
        geoLocation: "",
        virtualPlatforms: [
          { platform: "telegram", participantLink: "https://t.me/example", viewerLink: "https://t.me/example_view", description: "", hidden: false },
        ],
        description: "Live now. Viewers welcome.",
        authorUsername: "devon.k",
        participants: ["sofia", "maria_v", "lucie", "arjun_p", "t.hoffmann", "devon.k", "maria_v", "lucie"],
        createdAt: now - 6 * day,
      },
      {
        id: "d4",
        topic: "Should city centres be car-free by 2030?",
        status: "looking",
        participantsMode: "limited",
        participantsLimit: 10,
        dateTimeHeld: "2026-08-02T17:30",
        publicity: "public",
        locationType: "geo",
        geoLocation: "Náměstí Míru, Prague",
        virtualPlatforms: [],
        description: "Public square meet-up. Family friendly.",
        authorUsername: "lucie",
        participants: ["sofia", "arjun_p"],
        createdAt: now - 5 * day,
      },
      {
        id: "d5",
        topic: "Universal basic income: safety net or moral hazard?",
        status: "cancelled",
        participantsMode: "undetermined",
        participantsLimit: null,
        dateTimeHeld: "",
        publicity: "public",
        locationType: "undetermined",
        geoLocation: "",
        virtualPlatforms: [],
        description: "Cancelled — will re-open later in the year.",
        authorUsername: "arjun_p",
        participants: [],
        createdAt: now - 8 * day,
      },
      {
        id: "d6",
        topic: "Are ranked-choice ballots better for local elections?",
        status: "looking",
        participantsMode: "limited",
        participantsLimit: 4,
        dateTimeHeld: "",
        publicity: "public",
        locationType: "virtual",
        geoLocation: "",
        virtualPlatforms: [
          { platform: "simplex", participantLink: "https://simplex.chat/invite/example", viewerLink: "", description: "Private link on request", hidden: false },
        ],
        description: "Small, focused, four people. Preparation notes shared beforehand.",
        authorUsername: "sofia",
        participants: ["maria_v"],
        createdAt: now - 1 * day,
      },
    ];

    var notifications = [
      { id: "n1", username: "sofia", text: "arjun_p joined your debate “Are ranked-choice ballots better for local elections?”", read: false, createdAt: now - 3600000 },
      { id: "n2", username: "sofia", text: "maria_v joined your debate “Are ranked-choice ballots better for local elections?”", read: false, createdAt: now - 7200000 },
      { id: "n3", username: "sofia", text: "Your debate “Open-source vs. proprietary software” is now ongoing.", read: true, createdAt: now - day },
    ];

    return {
      users: users,
      debates: debates,
      reports: [],
      notifications: notifications,
      session: "sofia", // first-load demo: start logged in so the full product is visible
      seq: 100,
    };
  }

  function nextId(prefix) {
    db.seq = (db.seq || 100) + 1;
    return prefix + db.seq;
  }

  /* ---------------------- validation ---------------------- */
  function validateUsername(name) {
    name = (name || "").trim();
    if (!name) return { en: "Username is required", ru: "Введите имя пользователя" };
    if (!USERNAME_RE.test(name))
      return { en: "Username contains forbidden symbols", ru: "Имя содержит запрещённые символы" };
    return null;
  }
  function validatePassword(pw) {
    pw = pw || "";
    if (pw.length < PW_MIN) return { en: "Your password is too short. Please, think of a longer password.", ru: "Пароль слишком короткий. Придумайте длиннее." };
    if (pw.length > PW_MAX) return { en: "Password is too long.", ru: "Пароль слишком длинный." };
    return null;
  }

  /* ---------------------- users / auth ---------------------- */
  function getUser(username) {
    return db.users.find(function (u) { return u.username === username; }) || null;
  }
  function currentUser() {
    return db.session ? getUser(db.session) : null;
  }
  function register(data) {
    var e = validateUsername(data.username);
    if (e) return { ok: false, field: "username", error: e };
    if (getUser(data.username.trim()))
      return { ok: false, field: "username", error: { en: "This username is already taken", ru: "Это имя уже занято" } };
    e = validatePassword(data.password);
    if (e) return { ok: false, field: "password", error: e };
    var user = {
      username: data.username.trim(),
      password: data.password,
      description: "",
      email: "",
      phone: "",
      contacts: [],
      createdAt: Date.now(),
    };
    db.users.push(user);
    db.session = user.username;
    commit();
    return { ok: true, user: user };
  }
  function login(username, password) {
    var u = getUser((username || "").trim());
    if (!u || u.password !== password)
      return { ok: false, error: { en: "Error: Login failed. Either the username does not exist, or the password is wrong.", ru: "Ошибка: вход не выполнен. Либо имя не существует, либо пароль неверный." } };
    db.session = u.username;
    commit();
    return { ok: true, user: u };
  }
  function logout() {
    db.session = null;
    commit();
  }
  function updateProfile(patch) {
    var u = currentUser();
    if (!u) return { ok: false };
    Object.assign(u, patch);
    commit();
    return { ok: true, user: u };
  }
  function changeUsername(newName) {
    var u = currentUser();
    if (!u) return { ok: false };
    var e = validateUsername(newName);
    if (e) return { ok: false, error: e };
    newName = newName.trim();
    if (newName !== u.username && getUser(newName))
      return { ok: false, error: { en: "This username is already taken", ru: "Это имя уже занято" } };
    var old = u.username;
    u.username = newName;
    // cascade
    db.debates.forEach(function (d) {
      if (d.authorUsername === old) d.authorUsername = newName;
      d.participants = d.participants.map(function (p) { return p === old ? newName : p; });
    });
    db.notifications.forEach(function (n) { if (n.username === old) n.username = newName; });
    db.session = newName;
    commit();
    return { ok: true };
  }
  function changePassword(current, next) {
    var u = currentUser();
    if (!u) return { ok: false };
    if (u.password !== current)
      return { ok: false, field: "current", error: { en: "Current password is wrong", ru: "Текущий пароль неверный" } };
    var e = validatePassword(next);
    if (e) return { ok: false, field: "next", error: e };
    u.password = next;
    commit();
    return { ok: true };
  }
  function deleteAccount(password) {
    var u = currentUser();
    if (!u) return { ok: false };
    if (u.password !== password)
      return { ok: false, error: { en: "Password is wrong", ru: "Пароль неверный" } };
    var name = u.username;
    db.users = db.users.filter(function (x) { return x.username !== name; });
    db.debates = db.debates.filter(function (d) { return d.authorUsername !== name; });
    db.debates.forEach(function (d) { d.participants = d.participants.filter(function (p) { return p !== name; }); });
    db.notifications = db.notifications.filter(function (n) { return n.username !== name; });
    db.session = null;
    commit();
    return { ok: true, username: name };
  }

  /* ---------------------- users list ---------------------- */
  function getUsers(opts) {
    opts = opts || {};
    var list = db.users.slice();
    if (opts.query) {
      var q = opts.query.toLowerCase();
      list = list.filter(function (u) { return u.username.toLowerCase().indexOf(q) >= 0; });
    }
    var dir = opts.sort === "za" ? -1 : 1;
    list.sort(function (a, b) { return a.username.localeCompare(b.username) * dir; });
    return list;
  }

  /* ---------------------- debates ---------------------- */
  function publicContacts(user) {
    if (!user) return [];
    return (user.contacts || []).filter(function (c) { return !c.hidden; });
  }
  function getDebate(id) {
    return db.debates.find(function (d) { return d.id === id; }) || null;
  }
  function visibleToViewer(d, viewer) {
    // Private debates are never shown in the list while ongoing (spec),
    // unless the viewer is the author.
    if (d.publicity === "private" && d.status === "ongoing") {
      return viewer && viewer === d.authorUsername;
    }
    return true;
  }
  function getDebates(opts) {
    opts = opts || {};
    var viewer = db.session;
    var list = db.debates.filter(function (d) { return visibleToViewer(d, viewer); });

    if (opts.author) list = list.filter(function (d) { return d.authorUsername === opts.author; });
    if (opts.participant) list = list.filter(function (d) { return d.participants.indexOf(opts.participant) >= 0; });
    if (opts.query) {
      var q = opts.query.toLowerCase();
      list = list.filter(function (d) { return d.topic.toLowerCase().indexOf(q) >= 0; });
    }
    if (opts.publishedBy && opts.publishedBy.length) {
      var names = opts.publishedBy.map(function (n) { return n.toLowerCase(); });
      list = list.filter(function (d) { return names.indexOf(d.authorUsername.toLowerCase()) >= 0; });
    }
    if (opts.statuses && opts.statuses.length) {
      list = list.filter(function (d) { return opts.statuses.indexOf(d.status) >= 0; });
    }

    var sort = opts.sort || "pub-new";
    list.sort(function (a, b) {
      switch (sort) {
        case "name-az": return a.topic.localeCompare(b.topic);
        case "name-za": return b.topic.localeCompare(a.topic);
        case "pub-old": return a.createdAt - b.createdAt;
        case "held-early": return (a.dateTimeHeld || "9") > (b.dateTimeHeld || "9") ? 1 : -1;
        case "held-late": return (a.dateTimeHeld || "0") < (b.dateTimeHeld || "0") ? 1 : -1;
        case "pub-new":
        default: return b.createdAt - a.createdAt;
      }
    });
    if (opts.limit) list = list.slice(0, opts.limit);
    return list;
  }
  function createDebate(data) {
    var u = currentUser();
    if (!u) return { ok: false };
    var d = Object.assign(
      {
        id: nextId("d"),
        topic: "",
        status: "looking",
        participantsMode: "undetermined",
        participantsLimit: null,
        dateTimeHeld: "",
        publicity: "undetermined",
        locationType: "undetermined",
        geoLocation: "",
        virtualPlatforms: [],
        description: "",
        authorUsername: u.username,
        participants: [],
        createdAt: Date.now(),
      },
      data
    );
    db.debates.push(d);
    commit();
    return { ok: true, debate: d };
  }
  function updateDebate(id, data) {
    var d = getDebate(id);
    if (!d) return { ok: false };
    Object.assign(d, data);
    commit();
    return { ok: true, debate: d };
  }
  function deleteDebate(id) {
    db.debates = db.debates.filter(function (d) { return d.id !== id; });
    commit();
    return { ok: true };
  }
  function participate(id) {
    var u = currentUser();
    var d = getDebate(id);
    if (!u || !d) return { ok: false };
    if (d.participants.indexOf(u.username) < 0) d.participants.push(u.username);
    commit();
    return { ok: true };
  }
  function withdraw(id) {
    var u = currentUser();
    var d = getDebate(id);
    if (!u || !d) return { ok: false };
    d.participants = d.participants.filter(function (p) { return p !== u.username; });
    commit();
    return { ok: true };
  }

  /* ---------------------- reports / notifications ---------------------- */
  function addReport(r) {
    r.id = nextId("r");
    r.createdAt = Date.now();
    r.byUsername = db.session || null;
    db.reports.push(r);
    commit();
    return { ok: true };
  }
  function getNotifications(username) {
    return db.notifications
      .filter(function (n) { return n.username === username; })
      .sort(function (a, b) { return b.createdAt - a.createdAt; });
  }
  function unreadCount(username) {
    return db.notifications.filter(function (n) { return n.username === username && !n.read; }).length;
  }
  function markNotificationsRead(username) {
    db.notifications.forEach(function (n) { if (n.username === username) n.read = true; });
    commit();
  }

  function resetDemo() {
    db = seed();
    save(db);
  }

  return {
    USERNAME_RE: USERNAME_RE, PW_MIN: PW_MIN, PW_MAX: PW_MAX,
    validateUsername: validateUsername, validatePassword: validatePassword,
    currentUser: currentUser, getUser: getUser,
    register: register, login: login, logout: logout,
    updateProfile: updateProfile, changeUsername: changeUsername,
    changePassword: changePassword, deleteAccount: deleteAccount,
    getUsers: getUsers,
    getDebate: getDebate, getDebates: getDebates,
    createDebate: createDebate, updateDebate: updateDebate, deleteDebate: deleteDebate,
    participate: participate, withdraw: withdraw,
    publicContacts: publicContacts,
    addReport: addReport,
    getNotifications: getNotifications, unreadCount: unreadCount, markNotificationsRead: markNotificationsRead,
    resetDemo: resetDemo,
  };
})();
