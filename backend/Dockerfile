# Multi-stage build — portable to any Docker-based host (Fly.io, Railway,
# Render's Docker runtime, etc). Render's native Node runtime (see render.yaml)
# is the simpler path for the free tier; this Dockerfile is the fallback for
# platforms that require a container image.

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-slim AS build
WORKDIR /app

# npm workspaces requires every workspace's package.json to resolve the
# lockfile, even though only "backend" gets installed/built here.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=backend --include-workspace-root

COPY backend ./backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build --workspace=backend

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=backend --include-workspace-root --omit=dev

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

# Apply pending migrations, then start the API. Safe to run on every boot —
# `migrate deploy` is a no-op when the schema is already current.
CMD ["sh", "-c", "npx prisma migrate deploy --schema=backend/prisma/schema.prisma && node backend/dist/index.js"]
