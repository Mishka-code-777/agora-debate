"use strict";
/* ==========================================================================
   Agora backend — database layer (Node built-in SQLite, no native deps)
   Returns objects shaped exactly like the front-end expects.
   ========================================================================== */
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const path = require("path");

const DB_PATH = process.env.AGORA_DB || path.join(__dirname, "data", "agora.db");
require("fs").mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  description TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT, identifier TEXT, description TEXT, hidden INTEGER DEFAULT 0, pos INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS debates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pub TEXT UNIQUE NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL,
  p_mode TEXT, p_limit INTEGER,
  date_held TEXT DEFAULT '',
  publicity TEXT, loc_type TEXT, geo TEXT DEFAULT '',
  description TEXT DEFAULT '',
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vplatforms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  debate_id INTEGER NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  platform TEXT, plink TEXT, vlink TEXT, description TEXT, hidden INTEGER DEFAULT 0, pos INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS participants (
  debate_id INTEGER NOT NULL REFERENCES debates(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (debate_id, user_id)
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT, target TEXT, reason TEXT, description TEXT,
  by_user_id INTEGER, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT, read INTEGER DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
`);

/* ---------------- validation ---------------- */
const USERNAME_RE = /^[A-Za-z0-9_.-]+$/;
const PW_MIN = 8, PW_MAX = 64;
function validateUsername(name) {
  name = (name || "").trim();
  if (!name) return { en: "Username is required", ru: "Введите имя пользователя" };
  if (name.length > 40) return { en: "Username is too long", ru: "Имя слишком длинное" };
  if (!USERNAME_RE.test(name)) return { en: "Username contains forbidden symbols", ru: "Имя содержит запрещённые символы" };
  return null;
}
function validatePassword(pw) {
  pw = pw || "";
  if (pw.length < PW_MIN) return { en: "Your password is too short. Please, think of a longer password.", ru: "Пароль слишком короткий. Придумайте длиннее." };
  if (pw.length > PW_MAX) return { en: "Password is too long.", ru: "Пароль слишком длинный." };
  return null;
}

/* ---------------- shaping ---------------- */
function shapeUser(row) {
  if (!row) return null;
  const contacts = db.prepare("SELECT platform,identifier,description,hidden FROM contacts WHERE user_id=? ORDER BY pos,id").all(row.id)
    .map((c) => ({ platform: c.platform, identifier: c.identifier, description: c.description || "", hidden: !!c.hidden }));
  return {
    username: row.username, description: row.description || "", email: row.email || "", phone: row.phone || "",
    contacts, createdAt: row.created_at,
  };
}
function shapeDebate(row) {
  if (!row) return null;
  const author = db.prepare("SELECT username FROM users WHERE id=?").get(row.author_id);
  const parts = db.prepare("SELECT u.username FROM participants p JOIN users u ON u.id=p.user_id WHERE p.debate_id=?").all(row.id).map((r) => r.username);
  const vps = db.prepare("SELECT platform,plink,vlink,description,hidden FROM vplatforms WHERE debate_id=? ORDER BY pos,id").all(row.id)
    .map((v) => ({ platform: v.platform, participantLink: v.plink || "", viewerLink: v.vlink || "", description: v.description || "", hidden: !!v.hidden }));
  return {
    id: row.pub, topic: row.topic, status: row.status,
    participantsMode: row.p_mode, participantsLimit: row.p_limit,
    dateTimeHeld: row.date_held || "", publicity: row.publicity,
    locationType: row.loc_type, geoLocation: row.geo || "",
    virtualPlatforms: vps, description: row.description || "",
    authorUsername: author ? author.username : "", participants: parts, createdAt: row.created_at,
  };
}

/* ---------------- users / auth ---------------- */
function userRowByName(name) { return db.prepare("SELECT * FROM users WHERE username=?").get(name) || null; }
function getUser(name) { return shapeUser(userRowByName(name)); }

function createUser(username, password) {
  let e = validateUsername(username); if (e) return { ok: false, field: "username", error: e };
  username = username.trim();
  if (userRowByName(username)) return { ok: false, field: "username", error: { en: "This username is already taken", ru: "Это имя уже занято" } };
  e = validatePassword(password); if (e) return { ok: false, field: "password", error: e };
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare("INSERT INTO users(username,password_hash,created_at) VALUES(?,?,?)").run(username, hash, Date.now());
  return { ok: true, userId: Number(info.lastInsertRowid), username };
}
function verifyUser(username, password) {
  const row = userRowByName((username || "").trim());
  if (!row || !bcrypt.compareSync(password || "", row.password_hash))
    return { ok: false, error: { en: "Error: Login failed. Either the username does not exist, or the password is wrong.", ru: "Ошибка: вход не выполнен. Либо имя не существует, либо пароль неверный." } };
  return { ok: true, userId: row.id, username: row.username };
}
function updateProfile(userId, patch) {
  const row = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
  if (!row) return { ok: false };
  db.prepare("UPDATE users SET description=?,email=?,phone=? WHERE id=?")
    .run(patch.description != null ? patch.description : row.description, patch.email != null ? patch.email : row.email, patch.phone != null ? patch.phone : row.phone, userId);
  if (Array.isArray(patch.contacts)) {
    db.prepare("DELETE FROM contacts WHERE user_id=?").run(userId);
    const ins = db.prepare("INSERT INTO contacts(user_id,platform,identifier,description,hidden,pos) VALUES(?,?,?,?,?,?)");
    patch.contacts.forEach((c, i) => { if (c.identifier) ins.run(userId, c.platform, c.identifier, c.description || "", c.hidden ? 1 : 0, i); });
  }
  return { ok: true };
}
function changeUsername(userId, newName) {
  const e = validateUsername(newName); if (e) return { ok: false, error: e };
  newName = newName.trim();
  const other = userRowByName(newName);
  if (other && other.id !== userId) return { ok: false, error: { en: "This username is already taken", ru: "Это имя уже занято" } };
  db.prepare("UPDATE users SET username=? WHERE id=?").run(newName, userId);
  return { ok: true, username: newName };
}
function changePassword(userId, current, next) {
  const row = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
  if (!row) return { ok: false };
  if (!bcrypt.compareSync(current || "", row.password_hash)) return { ok: false, field: "current", error: { en: "Current password is wrong", ru: "Текущий пароль неверный" } };
  const e = validatePassword(next); if (e) return { ok: false, field: "next", error: e };
  db.prepare("UPDATE users SET password_hash=? WHERE id=?").run(bcrypt.hashSync(next, 10), userId);
  return { ok: true };
}
function deleteAccount(userId, password) {
  const row = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
  if (!row) return { ok: false };
  if (!bcrypt.compareSync(password || "", row.password_hash)) return { ok: false, error: { en: "Password is wrong", ru: "Пароль неверный" } };
  db.prepare("DELETE FROM users WHERE id=?").run(userId); // cascades
  return { ok: true, username: row.username };
}
function listUsers(opts) {
  opts = opts || {};
  let rows = db.prepare("SELECT * FROM users").all();
  if (opts.query) { const q = opts.query.toLowerCase(); rows = rows.filter((r) => r.username.toLowerCase().includes(q)); }
  const dir = opts.sort === "za" ? -1 : 1;
  rows.sort((a, b) => a.username.localeCompare(b.username) * dir);
  return rows.map(shapeUser);
}

/* ---------------- debates ---------------- */
function debateRow(pub) { return db.prepare("SELECT * FROM debates WHERE pub=?").get(pub) || null; }
function getDebate(pub) { return shapeDebate(debateRow(pub)); }
function newPub() { return "d" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

function listDebates(opts, viewerId) {
  opts = opts || {};
  let rows = db.prepare("SELECT * FROM debates").all();
  // private + ongoing hidden unless viewer is author
  rows = rows.filter((d) => !(d.publicity === "private" && d.status === "ongoing" && d.author_id !== viewerId));
  let list = rows.map(shapeDebate);
  if (opts.author) list = list.filter((d) => d.authorUsername === opts.author);
  if (opts.participant) list = list.filter((d) => d.participants.includes(opts.participant));
  if (opts.query) { const q = opts.query.toLowerCase(); list = list.filter((d) => d.topic.toLowerCase().includes(q)); }
  if (opts.publishedBy && opts.publishedBy.length) { const n = opts.publishedBy.map((x) => x.toLowerCase()); list = list.filter((d) => n.includes(d.authorUsername.toLowerCase())); }
  if (opts.statuses && opts.statuses.length) list = list.filter((d) => opts.statuses.includes(d.status));
  const sort = opts.sort || "pub-new";
  list.sort((a, b) => {
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
}
function saveVplatforms(debateId, arr) {
  db.prepare("DELETE FROM vplatforms WHERE debate_id=?").run(debateId);
  const ins = db.prepare("INSERT INTO vplatforms(debate_id,platform,plink,vlink,description,hidden,pos) VALUES(?,?,?,?,?,?,?)");
  (arr || []).forEach((v, i) => { if (v.participantLink || v.viewerLink) ins.run(debateId, v.platform, v.participantLink || "", v.viewerLink || "", v.description || "", v.hidden ? 1 : 0, i); });
}
function createDebate(authorId, data) {
  if (!data.topic || !data.topic.trim()) return { ok: false, error: { en: "Please enter a topic", ru: "Введите тему" } };
  const pub = newPub();
  const info = db.prepare(`INSERT INTO debates(pub,topic,status,p_mode,p_limit,date_held,publicity,loc_type,geo,description,author_id,created_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    pub, data.topic.trim(), data.status || "looking", data.participantsMode || "undetermined",
    data.participantsMode === "limited" ? (data.participantsLimit || null) : null,
    data.dateTimeHeld || "", data.publicity || "undetermined", data.locationType || "undetermined",
    data.locationType === "geo" ? (data.geoLocation || "") : "", data.description || "", authorId, Date.now());
  const id = Number(info.lastInsertRowid);
  if (data.locationType === "virtual") saveVplatforms(id, data.virtualPlatforms);
  return { ok: true, debate: shapeDebate(debateRow(pub)) };
}
function updateDebate(pub, authorId, data) {
  const row = debateRow(pub);
  if (!row) return { ok: false, notFound: true };
  if (row.author_id !== authorId) return { ok: false, forbidden: true };
  db.prepare(`UPDATE debates SET topic=?,status=?,p_mode=?,p_limit=?,date_held=?,publicity=?,loc_type=?,geo=?,description=? WHERE id=?`).run(
    (data.topic || row.topic).trim(), data.status, data.participantsMode,
    data.participantsMode === "limited" ? (data.participantsLimit || null) : null,
    data.dateTimeHeld || "", data.publicity, data.locationType,
    data.locationType === "geo" ? (data.geoLocation || "") : "", data.description || "", row.id);
  saveVplatforms(row.id, data.locationType === "virtual" ? data.virtualPlatforms : []);
  return { ok: true, debate: shapeDebate(debateRow(pub)) };
}
function deleteDebate(pub, authorId) {
  const row = debateRow(pub);
  if (!row) return { ok: false, notFound: true };
  if (row.author_id !== authorId) return { ok: false, forbidden: true };
  db.prepare("DELETE FROM debates WHERE id=?").run(row.id);
  return { ok: true };
}
function participate(pub, userId) {
  const row = debateRow(pub); if (!row) return { ok: false };
  db.prepare("INSERT OR IGNORE INTO participants(debate_id,user_id) VALUES(?,?)").run(row.id, userId);
  return { ok: true };
}
function withdraw(pub, userId) {
  const row = debateRow(pub); if (!row) return { ok: false };
  db.prepare("DELETE FROM participants WHERE debate_id=? AND user_id=?").run(row.id, userId);
  return { ok: true };
}

/* ---------------- reports / notifications ---------------- */
function addReport(byUserId, r) {
  db.prepare("INSERT INTO reports(type,target,reason,description,by_user_id,created_at) VALUES(?,?,?,?,?,?)")
    .run(r.type, r.targetId, r.reason, r.description || "", byUserId || null, Date.now());
  return { ok: true };
}
function listNotifications(userId) {
  return db.prepare("SELECT text,read,created_at FROM notifications WHERE user_id=? ORDER BY created_at DESC").all(userId)
    .map((n) => ({ text: n.text, read: !!n.read, createdAt: n.created_at }));
}
function unreadCount(userId) { return db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND read=0").get(userId).c; }
function markRead(userId) { db.prepare("UPDATE notifications SET read=1 WHERE user_id=?").run(userId); return { ok: true }; }

/* ---------------- sessions ---------------- */
function createSession(userId) {
  const token = require("crypto").randomBytes(24).toString("hex");
  db.prepare("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)").run(token, userId, Date.now());
  return token;
}
function sessionUser(token) {
  if (!token) return null;
  const s = db.prepare("SELECT user_id FROM sessions WHERE token=?").get(token);
  if (!s) return null;
  return db.prepare("SELECT * FROM users WHERE id=?").get(s.user_id) || null;
}
function destroySession(token) { if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(token); }

/* ---------------- seed (demo data, only if empty) ---------------- */
function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  if (count > 0) return;
  const now = Date.now(), day = 86400000;
  const mk = (username, description) => {
    const r = createUser(username, "password123");
    if (description) db.prepare("UPDATE users SET description=? WHERE id=?").run(description, r.userId);
    return r.userId;
  };
  const sofia = mk("sofia", "Debate organiser and moderator. I care about clear arguments and good faith. Ask me about ethics, tech policy and city life.");
  const maria = mk("maria_v", "Art historian. Interested in the boundary between craft and technology.");
  const tom = mk("t.hoffmann", "Small-business owner from Berlin. Pragmatic optimist.");
  const devon = mk("devon.k", "Public-sector software engineer. Open-source advocate.");
  const lucie = mk("lucie", "Urbanist. Prague. Cars are guests in the city, not owners.");
  const arjun = mk("arjun_p", "Economics student. I change my mind when the evidence is good.");
  const addContact = db.prepare("INSERT INTO contacts(user_id,platform,identifier,description,hidden,pos) VALUES(?,?,?,?,?,?)");
  addContact.run(sofia, "telegram", "@sofia_debates", "Fastest way to reach me", 0, 0);
  addContact.run(sofia, "signal", "sofia.99", "", 0, 1);
  addContact.run(sofia, "discord", "sofia#2201", "For group calls", 1, 2);
  addContact.run(maria, "instagram", "@maria.v.art", "", 0, 0);
  addContact.run(devon, "mastodon", "@devon@fosstodon.org", "", 0, 0);

  function mkDebate(d, parts, vps) {
    const info = db.prepare(`INSERT INTO debates(pub,topic,status,p_mode,p_limit,date_held,publicity,loc_type,geo,description,author_id,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(d.pub, d.topic, d.status, d.p_mode, d.p_limit, d.date_held || "", d.publicity, d.loc_type, d.geo || "", d.description || "", d.author_id, d.created_at);
    const id = Number(info.lastInsertRowid);
    (parts || []).forEach((uid) => db.prepare("INSERT OR IGNORE INTO participants(debate_id,user_id) VALUES(?,?)").run(id, uid));
    (vps || []).forEach((v, i) => db.prepare("INSERT INTO vplatforms(debate_id,platform,plink,vlink,description,hidden,pos) VALUES(?,?,?,?,?,?,?)").run(id, v.platform, v.plink, v.vlink || "", v.description || "", v.hidden ? 1 : 0, i));
  }
  mkDebate({ pub: "d1", topic: "Should AI-generated art be eligible for traditional art prizes?", status: "looking", p_mode: "limited", p_limit: 6, publicity: "public", loc_type: "virtual", author_id: maria, created_at: now - 2 * day, description: "A structured debate on whether works produced with generative models belong in the same category as hand-made pieces. Two sides, three rounds, moderated." }, [arjun, lucie, devon, tom], [{ platform: "discord", plink: "https://discord.gg/example", vlink: "https://youtube.com/@example", description: "Main stage" }]);
  mkDebate({ pub: "d2", topic: "Is a four-day work week realistic for small businesses?", status: "awaiting", p_mode: "undetermined", p_limit: null, date_held: "2026-07-18T19:00", publicity: "public", loc_type: "geo", geo: "Café Central, Berlin", author_id: tom, created_at: now - 4 * day, description: "In-person round table. Bring your own numbers." }, [sofia], []);
  mkDebate({ pub: "d3", topic: "Open-source vs. proprietary software in public institutions", status: "ongoing", p_mode: "limited", p_limit: 8, publicity: "public", loc_type: "virtual", author_id: devon, created_at: now - 6 * day, description: "Live now. Viewers welcome." }, [sofia, maria, lucie, arjun, tom], [{ platform: "telegram", plink: "https://t.me/example", vlink: "https://t.me/example_view" }]);
  mkDebate({ pub: "d4", topic: "Should city centres be car-free by 2030?", status: "looking", p_mode: "limited", p_limit: 10, date_held: "2026-08-02T17:30", publicity: "public", loc_type: "geo", geo: "Náměstí Míru, Prague", author_id: lucie, created_at: now - 5 * day, description: "Public square meet-up. Family friendly." }, [sofia, arjun], []);
  mkDebate({ pub: "d5", topic: "Universal basic income: safety net or moral hazard?", status: "cancelled", p_mode: "undetermined", p_limit: null, publicity: "public", loc_type: "undetermined", author_id: arjun, created_at: now - 8 * day, description: "Cancelled — will re-open later in the year." }, [], []);
  mkDebate({ pub: "d6", topic: "Are ranked-choice ballots better for local elections?", status: "looking", p_mode: "limited", p_limit: 4, publicity: "public", loc_type: "virtual", author_id: sofia, created_at: now - 1 * day, description: "Small, focused, four people. Preparation notes shared beforehand." }, [maria], [{ platform: "simplex", plink: "https://simplex.chat/invite/example", vlink: "", description: "Private link on request" }]);

  const addNotif = db.prepare("INSERT INTO notifications(user_id,text,read,created_at) VALUES(?,?,?,?)");
  addNotif.run(sofia, "arjun_p joined your debate “Are ranked-choice ballots better for local elections?”", 0, now - 3600000);
  addNotif.run(sofia, "maria_v joined your debate “Are ranked-choice ballots better for local elections?”", 0, now - 7200000);
  addNotif.run(sofia, "Your debate “Open-source vs. proprietary software” is now ongoing.", 1, now - day);
}
seedIfEmpty();

module.exports = {
  validateUsername, validatePassword,
  getUser, createUser, verifyUser, updateProfile, changeUsername, changePassword, deleteAccount, listUsers,
  getDebate, listDebates, createDebate, updateDebate, deleteDebate, participate, withdraw,
  addReport, listNotifications, unreadCount, markRead,
  createSession, sessionUser, destroySession,
};
