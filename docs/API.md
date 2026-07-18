# API Reference

Base URL: `{API_URL}/api` (local: `http://localhost:5000/api`)

All responses follow `{ success: boolean, data?, message?, errors? }`. Authenticated routes expect `Authorization: Bearer <accessToken>`. Mutating routes additionally require the CSRF double-submit header `x-csrf-token` (read from the `csrf_token` cookie — handled automatically by the bundled Axios client).

## Auth — `/auth`

| Method | Path            | Auth           | Notes                                                                                           |
| ------ | --------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| POST   | `/auth/signup`  | —              | Rate-limited. Sets an httpOnly refresh-token cookie.                                            |
| POST   | `/auth/login`   | —              | Rate-limited.                                                                                   |
| POST   | `/auth/refresh` | refresh cookie | Rotates the refresh token. Reuse of a consumed token revokes **all** sessions for that account. |
| POST   | `/auth/logout`  | ✅             |                                                                                                 |
| GET    | `/auth/me`      | ✅             | Returns the current student (includes `role`).                                                  |

## Profile — `/profile`

| Method | Path       | Auth | Notes                                                                         |
| ------ | ---------- | ---- | ----------------------------------------------------------------------------- |
| GET    | `/profile` | ✅   | `{ isComplete, profile }` — `profile` is `null` until onboarding is finished. |
| PUT    | `/profile` | ✅   | Create or update. Invalidates cached recommendations for the student.         |

## Universities — `/universities`

| Method | Path                        | Auth | Notes                                                                                                                                                                                                                                                                                                                |
| ------ | --------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/universities`             | —    | Query params: `q` (free text), `city`, `state`, `type` (`UNIVERSITY`\|`TECHNICAL_UNIVERSITY`\|`APPLIED_SCIENCES`), `degree`, `field`, `language`, `intake`, `tuitionMin`, `tuitionMax`, `hasDormitory`, `sortBy` (`ranking`\|`tuition`\|`name`), `page`. All list-type params accept comma-separated values. Cached. |
| GET    | `/universities/:id`         | —    | Full detail incl. `courses[]`.                                                                                                                                                                                                                                                                                       |
| GET    | `/universities/search?q=`   | —    | Legacy alias of the `q` param above.                                                                                                                                                                                                                                                                                 |
| GET    | `/universities/:id/courses` | —    |                                                                                                                                                                                                                                                                                                                      |

## Courses — `/courses`

| Method | Path           | Auth | Notes                                                                |
| ------ | -------------- | ---- | -------------------------------------------------------------------- |
| GET    | `/courses`     | —    | Query: `q`, `degree`, `field`, `language`, `intake`, `page`. Cached. |
| GET    | `/courses/:id` | —    | Includes parent university.                                          |

## Recommendations — `/recommendations`

| Method | Path                            | Auth               | Notes                                                                                                                                                                                                                                                 |
| ------ | ------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/recommendations/universities` | ✅                 | **University-level** matches ranked 0–100 with a per-dimension breakdown (`academicFit`, `languageFit`, `affordability`, `programAlignment`, `preferenceBonus`) and plain-English `reasons[]`. Cached 5 min per student, invalidated on profile save. |
| POST   | `/recommendations/generate`     | ✅                 | Legacy course-level matcher (Phase 3).                                                                                                                                                                                                                |
| GET    | `/recommendations/:studentId`   | ✅ (self or admin) | Legacy course-level cache read.                                                                                                                                                                                                                       |

## Applications — `/applications`

Student-owned; every route is scoped to the authenticated user server-side.

| Method | Path                | Auth | Notes                                                                                               |
| ------ | ------------------- | ---- | --------------------------------------------------------------------------------------------------- |
| GET    | `/applications`     | ✅   | Ordered by deadline.                                                                                |
| POST   | `/applications`     | ✅   | Body: `courseId` (preferred) or `universityName`+`programName`, plus `status`, `deadline`, `notes`. |
| PATCH  | `/applications/:id` | ✅   | Update `status`/`deadline`/`notes`.                                                                 |
| DELETE | `/applications/:id` | ✅   |                                                                                                     |

## Admin — Data Quality — `/quality` _(admin role required)_

| Method | Path                                      | Notes                                                            |
| ------ | ----------------------------------------- | ---------------------------------------------------------------- |
| GET    | `/quality/metrics`                        | Catalog-wide completeness/eligibility stats.                     |
| GET    | `/quality/program/:courseId/completeness` | Live recalculation for one program.                              |
| GET    | `/quality/program/:courseId/audit-trail`  | Field-level change history.                                      |
| GET    | `/quality/review-queue`                   | Paginated; filter by `status`.                                   |
| GET    | `/quality/review-queue/:id`               |                                                                  |
| PATCH  | `/quality/review-queue/:id/approve`       | Body: `{ reviewedBy, notes? }`.                                  |
| PATCH  | `/quality/review-queue/:id/reject`        | Body: `{ reviewedBy, reason }`.                                  |
| POST   | `/quality/trigger-review-scan`            | Recalculates scores/eligibility for every program. Rate-limited. |

## Admin — Scraper — `/scraper` _(admin role required)_

| Method | Path                                       | Notes                                                                                                |
| ------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| POST   | `/scraper/run`                             | Enqueues a full scrape (202 Accepted, deduplicated against any run already in flight). Rate-limited. |
| GET    | `/scraper/status`                          | Scheduler + live queue metrics.                                                                      |
| GET    | `/scraper/queue/dead-letters`              | Jobs that exhausted retries.                                                                         |
| POST   | `/scraper/queue/dead-letters/:jobId/retry` | Re-queue with a fresh attempt budget.                                                                |

## Health

| Method | Path      | Notes                                          |
| ------ | --------- | ---------------------------------------------- |
| GET    | `/health` | No auth. Used as the Render health-check path. |
