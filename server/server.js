"use strict";
/* ==========================================================================
   Agora backend — Express API + static host
   ========================================================================== */
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, ".."); // frontend lives in the repo root
const COOKIE = "agora_session";
const PROD = process.env.NODE_ENV === "production";
// Secure cookies require HTTPS. Default on in production; override with
// AGORA_SECURE=false when serving over plain HTTP (e.g. local network).
const SECURE = process.env.AGORA_SECURE ? process.env.AGORA_SECURE === "true" : PROD;

app.set("trust proxy", 1); // honour X-Forwarded-Proto behind nginx/Caddy
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());

// Never expose backend source or the database over HTTP
app.use((req, res, next) => {
  if (req.path.startsWith("/server") || req.path.startsWith("/.")) return res.status(404).end();
  next();
});

/* ---------------- helpers ---------------- */
function currentUser(req) { return db.sessionUser(req.cookies[COOKIE]); }
function setSession(res, userId) {
  const token = db.createSession(userId);
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 1000 * 60 * 60 * 24 * 30, path: "/" });
}
function requireAuth(req, res) {
  const u = currentUser(req);
  if (!u) { res.status(401).json({ ok: false, error: { en: "Not authenticated", ru: "Требуется вход" } }); return null; }
  return u;
}
function listParam(v) { return v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : []; }

/* ---------------- auth ---------------- */
app.post("/api/register", (req, res) => {
  const r = db.createUser(req.body.username, req.body.password);
  if (!r.ok) return res.status(400).json(r);
  setSession(res, r.userId);
  res.json({ ok: true, user: db.getUser(r.username) });
});
app.post("/api/login", (req, res) => {
  const r = db.verifyUser(req.body.username, req.body.password);
  if (!r.ok) return res.status(401).json(r);
  setSession(res, r.userId);
  res.json({ ok: true, user: db.getUser(r.username) });
});
app.post("/api/logout", (req, res) => {
  db.destroySession(req.cookies[COOKIE]);
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true });
});
app.get("/api/me", (req, res) => {
  const u = currentUser(req);
  if (!u) return res.json({ user: null, unread: 0 });
  res.json({ user: db.getUser(u.username), unread: db.unreadCount(u.id) });
});

/* ---------------- profile ---------------- */
app.patch("/api/me", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  db.updateProfile(u.id, req.body || {});
  res.json({ ok: true, user: db.getUser(u.username) });
});
app.post("/api/me/username", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.changeUsername(u.id, req.body.username);
  if (!r.ok) return res.status(400).json(r);
  res.json({ ok: true, username: r.username });
});
app.post("/api/me/password", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.changePassword(u.id, req.body.current, req.body.next);
  if (!r.ok) return res.status(400).json(r);
  res.json({ ok: true });
});
app.delete("/api/me", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.deleteAccount(u.id, req.body.password);
  if (!r.ok) return res.status(400).json(r);
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ ok: true, username: r.username });
});

/* ---------------- users ---------------- */
app.get("/api/users", (req, res) => {
  res.json({ users: db.listUsers({ query: req.query.query, sort: req.query.sort }) });
});
app.get("/api/users/:username", (req, res) => {
  const u = db.getUser(req.params.username);
  if (!u) return res.status(404).json({ error: { en: "User not found", ru: "Пользователь не найден" } });
  res.json({ user: u });
});

/* ---------------- debates ---------------- */
app.get("/api/debates", (req, res) => {
  const viewer = currentUser(req);
  res.json({
    debates: db.listDebates({
      query: req.query.query, sort: req.query.sort,
      author: req.query.author, participant: req.query.participant,
      statuses: listParam(req.query.statuses), publishedBy: listParam(req.query.publishedBy),
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 0,
    }, viewer ? viewer.id : null),
  });
});
app.get("/api/debates/:id", (req, res) => {
  const d = db.getDebate(req.params.id);
  if (!d) return res.status(404).json({ error: { en: "Debate not found", ru: "Дебат не найден" } });
  res.json({ debate: d });
});
app.post("/api/debates", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.createDebate(u.id, req.body || {});
  if (!r.ok) return res.status(400).json(r);
  res.json({ ok: true, debate: r.debate });
});
app.patch("/api/debates/:id", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.updateDebate(req.params.id, u.id, req.body || {});
  if (!r.ok) return res.status(r.forbidden ? 403 : 404).json(r);
  res.json({ ok: true, debate: r.debate });
});
app.delete("/api/debates/:id", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  const r = db.deleteDebate(req.params.id, u.id);
  if (!r.ok) return res.status(r.forbidden ? 403 : 404).json(r);
  res.json({ ok: true });
});
app.post("/api/debates/:id/participate", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  db.participate(req.params.id, u.id); res.json({ ok: true });
});
app.post("/api/debates/:id/withdraw", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  db.withdraw(req.params.id, u.id); res.json({ ok: true });
});

/* ---------------- reports / notifications ---------------- */
app.post("/api/reports", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  db.addReport(u.id, req.body || {});
  res.json({ ok: true });
});
app.get("/api/notifications", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  res.json({ items: db.listNotifications(u.id), unread: db.unreadCount(u.id) });
});
app.post("/api/notifications/read", (req, res) => {
  const u = requireAuth(req, res); if (!u) return;
  db.markRead(u.id); res.json({ ok: true });
});

/* ---------------- static frontend ---------------- */
app.use(express.static(ROOT, { extensions: ["html"] }));

// SPA-ish fallback: unknown non-API paths -> 404 page
app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: { en: "Not found", ru: "Не найдено" } });
  res.status(404).sendFile(path.join(ROOT, "404.html"));
});

app.listen(PORT, () => console.log("Agora server on http://localhost:" + PORT));
