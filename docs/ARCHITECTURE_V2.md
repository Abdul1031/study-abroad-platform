# Architecture V2 — Scaling to Every German University

**Status:** Blueprint (July 2026) · **Scope:** ~400 universities, 20,000+ programs, thousands of daily users
**Current state:** 15 universities / 107 programs on Express + Prisma + PostgreSQL — the stack below is an evolution of what exists, not a rewrite.

---

## 1. Database schema & relationships

The Phase 5 schema (Course + ProgramRequirement/Intake/Fee/Module/History/Review) is already the right shape. Three structural upgrades take it to catalog scale:

### 1a. Normalize the taxonomy (highest priority)

`Course.field` currently mixes codes (`CS`) and free text (`Civil Engineering`) — today's filters work via keyword mapping, which does not scale past a few hundred programs.

```prisma
model Subject {
  id       String    @id @default(cuid())
  slug     String    @unique   // "computer-science"
  name     String               // "Computer Science"
  parentId String?              // tree: STEM > Engineering > Mechanical
  parent   Subject?  @relation("SubjectTree", fields: [parentId], references: [id])
  children Subject[] @relation("SubjectTree")
  aliases  SubjectAlias[]       // "CS", "Informatik", "Software Engineering"
  courses  Course[]
}
```

Ingestion maps raw scraped field text → `SubjectAlias` → canonical `Subject`. Unmapped values land in the admin review queue instead of polluting filters.

### 1b. Structured admission requirements

Extend `ProgramRequirement` for the full German-specific matrix:
`apsRequired Boolean`, `apsNotes`, `workExperienceYears Int?`, `germanLevel (A1–C2)`, `toeflMinimum`, `greRequired`, `requiredDocuments Json` (typed list: transcript, LOR count, SOP, CV), `uniAssistRequired Boolean`, `ncRestricted Boolean` (numerus clausus). Scholarships get their own `Scholarship` model (name, provider, amountEuros, deadline, url, `universityId?`/`courseId?`).

### 1c. Student profile extensions

Add to `Student` for the richer matching factors: `preferredCities String[]`, `preferredUniversityType`, `preferredLanguage`, `workExperienceYears`, `germanLevel`, `apsCertified Boolean`. The wizard grows one "Extended preferences" step; every field is optional so existing profiles stay valid.

**Indexes at scale:** the existing composite indexes plus `pg_trgm` GIN indexes on `Course.name` and `University.name` (raw SQL migration) for fast fuzzy search, and a generated `tsvector` column when full-text search lands (§3).

---

## 2. Data collection strategy

Layered by trust, reconciled by the existing audit trail:

| Layer | Source                                                                                                                                                                | Cadence                 | Trust                                 |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------- |
| 1     | **Official datasets**: [Hochschulkompass](https://www.hochschulkompass.de) (HRK, all ~400 institutions + ~23,000 programs, CSV/export), DAAD International Programmes | Monthly import          | Highest — seeds the catalog skeleton  |
| 2     | **Structured scraping**: per-university adapters (the existing `BaseScraper` fleet) for fees, deadlines, requirements                                                 | Weekly via ScraperQueue | Medium — must pass `ProgramValidator` |
| 3     | **Admin curation**: review-queue corrections, manual enrichment of top-100 programs                                                                                   | Continuous              | High — human-verified, wins conflicts |
| 4     | **Community feedback**: "report outdated info" button on program pages                                                                                                | Continuous              | Low — creates review-queue items only |

Rules: Hochschulkompass creates/retires program rows (it is the source of truth for _existence_); scrapers only _enrich_ rows, never create them (this kills the nav-menu-junk class of bug permanently). Every write goes through `ProgramAuditService` (already built), so conflicting sources are diffable and reversible. Each source gets a `dataSource` + `sourceTrust` stamp on `ProgramHistory`.

Scaling ingestion: the current `ScraperQueueService` is BullMQ-shaped by design — at ~50+ universities, swap the in-process driver for BullMQ + Redis (same `enqueue/on/getMetrics/shutdown` surface, one adapter file) and enqueue **per-university jobs** instead of one full-run job, with the per-university dedup keys the service already supports.

## 3. Search & filtering architecture

Three stages, each an upgrade of the last — don't jump to stage 3 early:

1. **Now (≤1k programs):** Prisma `contains` + keyword-mapped field filters (shipped today), cached 60s in the LRU layer.
2. **At ~5k programs:** PostgreSQL native FTS — generated `tsvector` column over course name + description + university name with `german` + `english` configs, `websearch_to_tsquery` ranking, `pg_trgm` for typo tolerance. No new infrastructure; one migration + one repository method. This comfortably serves 20k programs.
3. **If search becomes a product pillar:** Meilisearch/Typesense read replica fed by the audit-trail change stream (facets, instant search, synonyms). Elasticsearch is overkill for this corpus size.

Filters stay in PostgreSQL regardless — they're exact predicates over indexed columns, which Postgres does better than any search engine.

## 4. Recommendation algorithm

Keep the interpretable scoring engine — students need to know _why_ a program matched. Evolve it in three layers:

**Layer 1 — Hard eligibility gate (SQL, cheap):** `isMatchEligible = true` (Phase 5 gate) AND degree-level fits AND no unmet hard blocker (IELTS below minimum with no planned test, APS missing for programs requiring it, budget below tuition+living floor). This cuts 20k programs to a few hundred candidates _in the database_, not in JS.

**Layer 2 — Weighted scoring (in service, per candidate):** the existing breakdown, extended:

| Factor                                          | Weight | Notes                                         |
| ----------------------------------------------- | ------ | --------------------------------------------- |
| Academic fit (CGPA vs requirement)              | 22     | Sigmoid, not cliff — 0.1 below minimum ≠ zero |
| Language eligibility (IELTS/TOEFL/German level) | 18     | Planned test dates count at a discount        |
| Budget fit (tuition + city cost-of-living)      | 15     | Uses `averageRentEuros` per city              |
| Field alignment (Subject tree distance)         | 15     | Exact subject > sibling > parent              |
| Intake match                                    | 8      |                                               |
| City/state preference                           | 7      |                                               |
| University type + ranking preference            | 7      |                                               |
| Work experience fit                             | 4      |                                               |
| Data quality bonus (`completenessScore`)        | 4      | Better-documented programs rank up            |

Weights live in a config table so admins can tune without deploys. Every result carries its factor breakdown (the UI already renders this).

**Layer 3 — Learning-to-rank (later, needs behavioral data):** log impressions → saves → applications per (student, program); train a gradient-boosted re-ranker over the Layer-2 factor vector; A/B against static weights. Do not start here — the platform needs months of interaction data first.

Results cache in `RecommendationCache` (exists) keyed on a profile hash; profile updates already invalidate it (shipped today).

## 5. Performance optimization

- **Caching (shipped):** in-process LRU with stampede protection on courses/universities reads; scrape-completion invalidation. Next step at multi-instance: same `CacheDriver` interface backed by Redis.
- **DB:** PgBouncer (transaction mode) in front of PostgreSQL; Prisma `connection_limit` tuned per instance; the `_count` selects and composite indexes shipped today; `EXPLAIN ANALYZE` budget of <50ms for every list endpoint.
- **API:** pagination everywhere (shipped), 202-async for heavy operations (shipped for scraper), gzip/brotli at the reverse proxy.
- **Frontend (shipped):** route-level code splitting, stable vendor chunks, TanStack Query caching, debounced search, optimistic mutations on the tracker.

## 6. Scalability roadmap

| Users             | Architecture                                                                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0 – 10k** (now) | Single Node instance + PostgreSQL. Everything shipped today is sized for this.                                                                                                                                                                                                         |
| **10k – 100k**    | 2–3 stateless API instances behind a load balancer · Redis for cache + BullMQ + rate limits · PgBouncer · scraper workers become separate processes consuming the queue · read replica for catalog queries (route via `prisma.$extends`)                                               |
| **100k+**         | CDN for static + program pages (they change weekly — cache aggressively) · search engine replica (§3) · partition `ProgramHistory` by month · consider separating the ingestion system into its own service — it's the only component with genuinely different scaling characteristics |

The deliberate constraint: **stay a modular monolith** with the existing feature-folder boundaries (`features/program-quality`, scraper, auth). Those folders are the future service seams if extraction ever becomes necessary; premature microservices would only add latency and deployment pain at this size.

## 7. Admin panel

The `/admin` dashboard (shipped) already covers quality metrics, the review queue with approve/reject, scraper queue controls, and dead-letter replay. Roadmap:

1. **Catalog CRUD** — create/edit universities and programs with Zod-validated forms; every save writes `ProgramHistory` with `changedBy: ADMIN`.
2. **Ingestion console** — per-source run history, diff viewer (audit trail already stores field-level diffs), un-mapped `SubjectAlias` triage.
3. **Taxonomy manager** — subject tree editor + alias assignment.
4. **Recommendation tuning** — weight editor with a "preview impact on N sample profiles" dry-run.
5. Real `role` column on Student (replacing the `ADMIN_EMAILS` bridge) with an audit log of admin actions.

## 8. Overall system architecture

```
                        ┌────────────────────────────┐
   Students ──────────► │  React SPA (code-split)    │
   Admins ────────────► │  TanStack Query cache      │
                        └────────────┬───────────────┘
                                     │ HTTPS · JWT (RTR) · CSRF
                        ┌────────────▼───────────────┐
                        │  Express API (N instances) │
                        │  security.middleware       │
                        │  (headers·CORS·rate·RBAC)  │
                        ├────────────────────────────┤
                        │  Feature modules:          │
                        │  auth · profile · catalog  │
                        │  recommendations · tracker │
                        │  program-quality · admin   │
                        └──┬──────────┬──────────┬───┘
              LRU→Redis ◄──┘          │          └──► ScraperQueue (→BullMQ)
                                      │                    │
                        ┌─────────────▼──────────┐   ┌─────▼──────────────┐
                        │ PostgreSQL (primary)   │   │ Scraper workers    │
                        │ + PgBouncer            │   │ Hochschulkompass   │
                        │ + read replica (later) │◄──┤ importer · per-uni │
                        │ + FTS / pg_trgm        │   │ adapters · valida- │
                        └────────────────────────┘   │ tor · audit trail  │
                                                     └────────────────────┘
```

**Execution order (each step ships value alone):**

1. Subject taxonomy + alias mapping (unblocks reliable filtering at any scale)
2. Hochschulkompass importer (catalog jumps 15 → ~400 universities with trusted skeleton data)
3. Extended requirements schema + wizard step (APS, German level, work experience)
4. Postgres FTS (search survives the catalog jump)
5. Recommendation engine v2 (layered gate + configurable weights)
6. Redis + BullMQ + multi-instance deploy (when traffic demands it)
