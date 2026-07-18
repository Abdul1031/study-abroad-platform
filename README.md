# StudyAbroad.de — Germany Study Abroad Platform

A full-stack platform that matches international students with German public universities based on their real academic profile — CGPA, language scores, budget, and subject preferences — and helps them track the application process end to end.

175 public institutions across all 16 Bundesländer, a transparent university-level recommendation engine, an automated scraping pipeline with data-quality scoring, and a hardened auth layer with refresh-token rotation.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Available scripts](#available-scripts)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [License](#license)

## Features

**For students**

- 6-step profile wizard with localStorage draft auto-save and backend persistence (edit mode once submitted)
- University-level recommendation engine — every match is scored 0–100 across academic fit, language, affordability, program alignment, and preference bonus, with plain-English reasons and a per-dimension breakdown
- Catalog of 175 public German universities (traditional, technical, and applied sciences) with filters by institution type, region/Bundesland, degree level, field, language, and tuition
- University detail pages with official website links, admission requirements, and program listings
- Application tracker (Kanban-style: Not Started → In Progress → Submitted → Decision) backed by a real database, not mock data

**Platform / admin**

- JWT auth with **Refresh Token Rotation** and reuse detection — a replayed refresh token instantly revokes every session for that account
- CSRF protection (double-submit cookie), rate limiting, and hardened response headers
- Role-based access control (student vs. admin) enforced server-side on every sensitive route
- Automated web scraper with a job queue (dedup, exponential backoff, dead-letter queue) and a weekly cron schedule
- Data-quality layer: completeness scoring, staleness detection, immutable audit trail, and an admin review queue for flagged programs
- Two-tier caching (in-memory LRU, cache-aside) on hot read endpoints, invalidated automatically after scrapes and profile edits

## Tech stack

**Frontend** — React 18 + TypeScript + Vite, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form + Zod, React Router 6

**Backend** — Node.js + Express + TypeScript, Prisma ORM + PostgreSQL, Zod validation, JWT + bcrypt, Cheerio (scraping), node-cron, p-queue

**Tooling** — npm workspaces + Turborepo, ESLint + Prettier, Husky pre-commit hooks

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system design and [`docs/`](./docs) for deeper dives into the recommendation engine, scraper pipeline, and security model.

```
Browser (React SPA)
   │  Axios + CSRF token + Bearer access token
   ▼
Express API  ──┬── Auth (JWT + RTR)
                ├── Universities / Courses (cached, filtered, searched)
                ├── Recommendations (university-level scoring engine)
                ├── Applications (student-owned tracker)
                ├── Profile (onboarding + edit)
                └── Admin: Quality review queue + Scraper controls (RBAC-gated)
   │
   ▼
Prisma ORM ──► PostgreSQL
   ▲
   │
Scraper job queue (dedup + backoff + DLQ) ──► weekly cron + on-demand admin trigger
```

## Local setup

### Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database (local install, Docker, or a free managed instance — see [Deployment](#deployment))

### Install & run

```bash
git clone https://github.com/Abdul1031/study-abroad-platform.git
cd study-abroad-platform
npm install

# Backend env
cp backend/.env.example backend/.env
# edit backend/.env — set DATABASE_URL at minimum

# Frontend env
cp frontend/.env.example frontend/.env

# Database
npm run prisma:generate
npm run prisma:migrate

# Seed 175 German public universities (idempotent — safe to re-run)
cd backend && npx tsx prisma/seed_universities_de.ts && cd ..

# Run everything
npm run dev
```

Frontend: http://localhost:3000 · Backend: http://localhost:5000/api/health

## Environment variables

See [`backend/.env.example`](./backend/.env.example) and [`frontend/.env.example`](./frontend/.env.example) for the full list with descriptions. The essentials:

| Variable                  | Required         | Notes                                                                       |
| ------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`            | ✅               | PostgreSQL connection string                                                |
| `JWT_SECRET`              | ✅ in production | 32+ random hex chars — the server refuses to boot in production without one |
| `FRONTEND_URL`            | recommended      | Used for CORS allowlisting                                                  |
| `ADMIN_EMAILS`            | optional         | Comma-separated list granted the admin role                                 |
| `VITE_API_URL` (frontend) | recommended      | Points the SPA at your deployed API                                         |

## Project structure

```
StudyAbroad/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── services/          # Business logic (recommendations, cache, scraper queue…)
│   │   ├── repositories/      # Data-access layer
│   │   ├── routes/            # Express routers
│   │   ├── middleware/        # Auth, security (CSRF/RTR/RBAC), error handling
│   │   ├── features/
│   │   │   └── program-quality/  # Completeness scoring, audit trail, review queue
│   │   └── domain/             # Zod schemas & shared types
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed_universities_de.ts
├── frontend/
│   └── src/
│       ├── features/           # auth, profile, universities, recommendations, tracker, admin, dashboard
│       ├── components/ui/      # Shared UI primitives
│       └── pages/
├── docs/                       # Architecture deep-dives
└── .github/workflows/          # CI
```

## Available scripts

Run from the repo root (npm workspaces + Turborepo):

```bash
npm run dev          # backend + frontend, parallel
npm run build         # build both workspaces
npm run lint           # lint both workspaces
npm run type-check     # tsc --noEmit for both workspaces
npm run prisma:studio  # visual database browser
```

## API overview

All endpoints are prefixed `/api`. Full reference in [`docs/API.md`](./docs/API.md).

| Area            | Endpoints                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth            | `POST /auth/signup`, `/login`, `/refresh` (rotating), `/logout`, `GET /auth/me`                                                                 |
| Profile         | `GET/PUT /profile`                                                                                                                              |
| Universities    | `GET /universities` (filters: `q`, `city`, `state`, `type`, `degree`, `field`, `language`, `tuitionMin/Max`, `sortBy`), `GET /universities/:id` |
| Courses         | `GET /courses`, `GET /courses/:id`                                                                                                              |
| Recommendations | `GET /recommendations/universities` (auth) — the scoring engine                                                                                 |
| Applications    | `GET/POST /applications`, `PATCH/DELETE /applications/:id` (auth, student-owned)                                                                |
| Admin — Quality | `GET /quality/metrics`, `/review-queue`, `PATCH .../approve\|reject` (admin only)                                                               |
| Admin — Scraper | `POST /scraper/run`, `GET /scraper/status`, `/scraper/queue/dead-letters` (admin only)                                                          |

## Deployment

Full walkthrough in [`DEPLOYMENT.md`](./DEPLOYMENT.md) — targets three free-tier services:

- **Neon** (PostgreSQL, free forever tier)
- **Render** (backend API, free web service)
- **Vercel** (frontend static hosting)

`render.yaml` and the backend `Dockerfile` are ready to go; connect the repo and deploy.

## License

MIT — see [`LICENSE`](./LICENSE).
