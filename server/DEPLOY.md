# Deploying Agora to your server

Agora is now a **real multi-user app**: a small Node.js API + SQLite database
that also serves the frontend. One process, one port.

- Backend: `server/server.js` (Express) + `server/db.js` (SQLite via Node's
  built-in `node:sqlite` — no native build step).
- Auth: username + password, **bcrypt-hashed**, session in an httpOnly cookie.
- Database: a single SQLite file. Seeded with demo data on first run
  (demo login `sofia` / `password123`). For a clean start, delete the DB file.
- Frontend auto-detects the API and switches from "demo" (localStorage) to
  "real" mode — no config needed.

Requirements: **Node.js ≥ 22** (for `node:sqlite`) or **Docker**.

---

## Option A — Docker (recommended)

From the repo root (where `Dockerfile` / `docker-compose.yml` live):

```bash
docker compose up -d --build
```

The app is now on `http://<server>:3000`. The database lives in the named
volume `agora-data` (survives restarts and rebuilds).

Update after new code:
```bash
git pull && docker compose up -d --build
```

## Option B — plain Node

```bash
cd server
npm ci --omit=dev
NODE_ENV=production PORT=3000 node server.js
```

Keep it running with a process manager, e.g. **pm2**:
```bash
npm i -g pm2
NODE_ENV=production pm2 start server.js --name agora
pm2 save && pm2 startup
```

Or a **systemd** unit (`/etc/systemd/system/agora.service`):
```ini
[Unit]
Description=Agora
After=network.target
[Service]
WorkingDirectory=/opt/agora/server
Environment=NODE_ENV=production PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
[Install]
WantedBy=multi-user.target
```

---

## HTTPS (put it behind a reverse proxy)

Terminate TLS with nginx or Caddy and proxy to the app on `:3000`.

**Caddy** (`Caddyfile`) — gets a certificate automatically:
```
your-domain.example {
    reverse_proxy localhost:3000
}
```

**nginx**:
```nginx
server {
    server_name your-domain.example;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
# then: certbot --nginx -d your-domain.example
```

The app trusts `X-Forwarded-Proto`, so secure cookies work behind the proxy.
If you ever serve over **plain HTTP** (no TLS), set `AGORA_SECURE=false` or
logins won't stick.

---

## Environment variables

| Var | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Listen port |
| `NODE_ENV` | — | `production` enables secure cookies |
| `AGORA_SECURE` | follows `NODE_ENV` | `true`/`false` to force the cookie Secure flag |
| `AGORA_DB` | `server/data/agora.db` (Docker: `/data/agora.db`) | SQLite file path |

## Backups

Back up the single SQLite file (`AGORA_DB`). In Docker it's in the `agora-data`
volume: `docker run --rm -v agora-data:/data -v $PWD:/backup alpine cp /data/agora.db /backup/`.

## Notes / next hardening (optional)

- Rate-limiting on `/api/login` and `/api/register`.
- A real CAPTCHA provider (hCaptcha / Cloudflare Turnstile) in place of the
  placeholder checkbox.
- Move from SQLite to Postgres if you expect heavy concurrent write load
  (the data layer is small and isolated in `db.js`).
