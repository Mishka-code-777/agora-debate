# Agora — production image (frontend + API in one container)
FROM node:22-alpine

WORKDIR /app

# Install backend dependencies first (better layer caching)
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy the rest (frontend at repo root + server code)
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV AGORA_DB=/data/agora.db

# SQLite database lives on a mounted volume so it survives restarts/redeploys
VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server/server.js"]
