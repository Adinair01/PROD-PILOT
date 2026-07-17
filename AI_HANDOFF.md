# PROD PILOT — Project Handoff Brief

> A complete, self-contained context document for an AI assistant or engineer
> picking up this codebase. Grounded in the actual source, not the README.

---

## 1. TL;DR

**PROD PILOT** is a multi-tenant SaaS web app — a *pre-development decision
intelligence platform*. Engineering team members (QA, Frontend, Backend, Data,
PM) submit short feedback; the system runs **sentiment analysis** on each entry,
aggregates it per organization, and produces **AI-grounded, structured
"go/no-go" decision plans** and dashboards for product managers.

- **Backend:** Node.js + Express 5 REST API (CommonJS), MongoDB via Mongoose 9.
- **Frontend:** React 19 SPA (Vite 7), React Router 7, Axios, Recharts.
- **AI:** HuggingFace DistilBERT (sentiment) + NVIDIA-hosted Mistral (structured JSON insights). Both optional — the app degrades to rule-based logic without keys.
- **Auth:** JWT (access + refresh) in httpOnly cookies; role-based access control; organization-scoped multi-tenancy.
- **Deploy target:** Frontend on Vercel/Netlify, API on Render, DB on MongoDB Atlas (see `DEPLOYMENT.md`).

---

## 2. What it does (product flow)

1. An **admin signs up** → this creates an **Organization** + the admin user in one step.
2. The admin **invites teammates** by email + role (QA/FE/BE/DATA/PM). Invite returns a one-time temp password (shared out-of-band — no email is sent).
3. Team members **log in** and **submit feedback** (free text, ≤2000 chars). Each submission is scored for sentiment (POSITIVE/NEGATIVE/NEUTRAL).
4. **Role dashboards** and **PM insights** aggregate the feedback: sentiment stats, per-role breakdown, 7-day trend, keyword-based issue clusters, affected teams, health score, risk level.
5. The **Decision Engine** lets a PM type a problem statement; the system grounds it in the org's real recent feedback and returns a structured decision plan (root cause, impact, recommended actions with owners/timelines, risks, edge cases). Each run is saved to **Decision History**.

---

## 3. Tech stack

**Backend** (root `package.json`, CommonJS, `type: "commonjs"`)
- express `^5`, mongoose `^9`, zod `^4`
- jsonwebtoken, bcrypt, cookie-parser, cors, helmet, express-rate-limit
- pino + pino-http (structured logging), dotenv
- @huggingface/inference (sentiment); NVIDIA Mistral called via raw `https`
- resend (password-reset email); @sentry/node (error monitoring, optional — no-ops without `SENTRY_DSN`)
- Node `>=18` (`.nvmrc` pins 20)

**Frontend** (`frontend/package.json`, ESM, `type: "module"`)
- react `^19`, react-dom `^19`, react-router-dom `^7`
- axios, recharts (charts), lucide-react (icons)
- @sentry/react (error monitoring, optional — no-ops without `VITE_SENTRY_DSN`)
- vite `^7`, eslint

**Tooling:** Vitest + Supertest + mongodb-memory-server (tests), ESLint + Prettier, GitHub Actions CI.

---

## 4. Repository layout

```
PRODPILOT/
├── package.json               # BACKEND package (scripts: dev/start/test/lint)
├── vitest.config.js
├── .github/workflows/ci.yml   # CI: backend lint+format+test, frontend lint+build
├── render.yaml                # API deploy blueprint (Render)
├── netlify.toml               # Frontend deploy (Netlify)
├── DEPLOYMENT.md              # Production deploy runbook
├── backend/
│   ├── .env.example
│   └── src/
│       ├── server.js          # entrypoint: env load, DB connect, graceful shutdown
│       ├── app.js             # express app: middleware, routes, health, error handler
│       ├── config/
│       │   ├── env.js         # zod-validated env (exits on invalid config)
│       │   └── db.js          # mongoose connect + connection event logging
│       ├── controllers/       # thin HTTP handlers (asyncHandler-wrapped)
│       ├── services/          # business logic (auth, feedback, analytics, ai, ...)
│       ├── models/            # mongoose schemas
│       ├── routes/            # express routers, per resource
│       ├── middlewares/       # auth, admin, rbac, validate, error
│       ├── utils/             # jwt, hash, cookies, logger, api-error, async-handler
│       └── validators/        # zod request schemas
├── frontend/
│   ├── vercel.json            # SPA rewrites for Vercel
│   ├── vite.config.js         # build + manual vendor chunks
│   └── src/
│       ├── main.jsx / App.jsx # router + route table
│       ├── api/axios.js       # axios instance + 401 interceptor
│       ├── pages/             # Landing, Login, Signup, Hub, RoleSelector,
│       │                      #   DecisionEngine, PM/QA/FE/BE/Data dashboards
│       ├── components/        # DashboardNav, ProtectedRoute, ErrorBoundary, Toast, ...
│       ├── hooks/             # useFeedback, useInsights
│       ├── utils/auth.js      # getUser/clearAuth (localStorage helpers)
│       └── styles/
└── tests/                     # health, auth, feedback (Supertest + in-memory Mongo)
```

> **Note:** the *root* `package.json` is the backend. The frontend has its own
> in `frontend/`. There is no backend/package.json.

---

## 5. Architecture & request lifecycle

```
Client (React SPA, Axios withCredentials)
        │  httpOnly cookie: accessToken  (or Authorization: Bearer)
        ▼
Express app.js
  helmet → pino-http → CORS(whitelist) → json(100kb) → cookieParser
        → rateLimit(global 120/min; strict 20/min on /auth & /decision-engine)
        ▼
  route → [requireAuth] → [requireAdmin/requireRole] → [validate(zod)] → controller
        ▼
  controller (asyncHandler) → service (business logic) → mongoose model → MongoDB
        ▼
  errorMiddleware (maps ZodError→422, CastError→400, dup key→409, ApiError→code, else→500)
```

- **Server** (`server.js`): validates env → connects DB → `app.listen`. Handles `SIGTERM/SIGINT` (graceful shutdown), `unhandledRejection`, `uncaughtException`.
- **Health:** `GET /health` (liveness `{status:"ok"}`), `GET /health/ready` (readiness — checks `mongoose.connection.readyState`, returns 200/503).
- **Security:** `x-powered-by` disabled; `trust proxy = 1` in production (for correct client IP + secure cookies behind a proxy).

---

## 6. Data model (MongoDB / Mongoose)

All documents have `createdAt`/`updatedAt` (timestamps). Multi-tenancy = every
domain document carries `organizationId`.

**Organization** (`organization.model.js`)
| field | type | notes |
|---|---|---|
| name | String | required |
| domain | String | unique, sparse, lowercase |

**User** (`user.js`) — exports `{ User, ROLES }`
| field | type | notes |
|---|---|---|
| organizationId | ObjectId → Organization | required, indexed |
| name | String | required |
| email | String | required, lowercased |
| passwordHash | String | bcrypt |
| role | String | enum `ROLES = ["QA","FE","BE","DATA","PM","ADMIN"]` |
- Unique compound index `{ organizationId, email }` → email is unique **per org**, not globally.

**Feedback** (`feedback.model.js`)
| field | type | notes |
|---|---|---|
| organizationId | ObjectId → Organization | required |
| userId | ObjectId → User | required |
| role | String | submitter's role (ADMIN normalized to "PM") |
| message | String | required, ≤2000 chars |
| sentiment | String | enum POSITIVE/NEUTRAL/NEGATIVE |
| sentimentScore | Number | model confidence |
- Compound index `{ organizationId, createdAt: -1 }` (matches the dominant query).

**DecisionHistory** (`decision-history.model.js`)
| field | type | notes |
|---|---|---|
| organizationId | ObjectId → Organization | required, indexed |
| userId | ObjectId → User | required |
| problemSummary | String | required (PM's problem statement) |
| additionalContext | String | optional |
| decision | Mixed | the full structured decision JSON returned by the AI |
- Compound index `{ organizationId, createdAt: -1 }`.

> There is **no** RefreshToken/Session collection (see auth notes §8).

---

## 7. API reference

Base path: **`/v1`**. All responses JSON. Auth via httpOnly `accessToken` cookie
(or `Authorization: Bearer <token>`). Errors: `{ error, [details] }`.

### Auth — `/v1/auth` (strict rate limit 20/min)
| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/admin/signup` | — | `adminSignupSchema` (name, email, password, orgName) | Create org + admin, set auth cookies |
| POST | `/login` | — | `loginSchema` (email, password) | Login, set auth cookies |
| POST | `/logout` | — | — | Revoke the current session server-side, clear auth cookies |
| POST | `/refresh` | refresh cookie | — | Rotate the session: issue a new access token **and** a new refresh cookie |
| POST | `/forgot-password` | — | `forgotPasswordSchema` (email) | Always returns a generic success message; emails a reset link (via Resend) for every matching account across orgs, if any |
| POST | `/reset-password` | — | `resetPasswordSchema` (token, newPassword) | Consume a one-time reset token, set the new password, revoke all of that user's existing sessions |

### Invite — `/v1/invite`
| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| POST | `/` | requireAuth + requireAdmin | `inviteUserSchema` (name, email, role) | Create a teammate; returns `{ user, tempPassword }` (cannot invite ADMIN) |

### Feedback — `/v1/feedback`
| Method | Path | Auth | Validation | Purpose |
|---|---|---|---|---|
| POST | `/` | requireAuth | `createFeedbackSchema` (message) | Submit feedback → runs sentiment → stores |
| GET | `/` | requireAuth | `listFeedbackQuerySchema` (page, limit) | Paginated org feedback, newest first |

### Insights — `/v1/insights` and Analytics — `/v1/analytics`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | requireAuth | Rule-based aggregate insights (health score, risk, priority feedback, sentiment + role breakdown) |

*(Both mount the same style of rule-based insight handler; see §14 gotchas re: overlap.)*

### PM Insights — `/v1/pm-insights`
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | requireAuth | Rich AI-structured insights (technical + business summary + action block), clusters, trend. Cached per org by feedback count. |

### Decision Engine — `/v1/decision-engine` (strict rate limit; all requireAuth)
| Method | Path | Validation | Purpose |
|---|---|---|---|
| GET | `/context` | — | Snapshot of org feedback used to ground decisions |
| POST | `/analyze` | `analyzeSchema` (problemSummary, additionalContext?) | Generate + persist a structured decision plan |
| GET | `/history` | — | List past decisions (org-scoped) |
| GET | `/history/:id` | `objectIdParam("id")` | Fetch one decision |
| DELETE | `/history/:id` | `objectIdParam("id")` | Delete one decision |

---

## 8. Auth & multi-tenancy

- **Tokens:** access token is a JWT (TTL `15m`, payload `{ userId, orgId, role }`, signed with `JWT_ACCESS_SECRET`), verified per-request with no DB hit. Refresh token is an **opaque, DB-backed session token** (random 32-byte value, stored hashed in the `RefreshToken` collection) — every refresh already needs a DB round-trip to check revocation, so a signed JWT bought nothing there.
- **Cookies** (`utils/cookies.js`): both httpOnly. `secure` + `sameSite` are driven by `COOKIE_SECURE` → when `true`: `Secure` + `SameSite=None` (required for cross-site prod); when `false` (local): `SameSite=Lax`. The refresh cookie is **path-scoped to `/v1/auth/refresh`** so it isn't sent on every request.
- **`requireAuth`** reads the token from the cookie first, then a Bearer header; verifies it; sets `req.user = { userId, orgId, role }`.
- **RBAC:** `requireRole(...roles)` (403 if role not allowed); `requireAdmin` gates the invite route (ADMIN only).
- **Tenancy:** services scope every query by `req.user.orgId`. Email is unique per org (a person could exist in two orgs).
- **Login is timing-safe:** it runs a bcrypt compare against a dummy hash even when the email doesn't exist, to avoid user-enumeration via response timing.
- **Onboarding:** `admin/signup` creates the org; there is **no public self-serve signup for non-admins** — they must be invited. Invited users get a `crypto.randomBytes` temp password returned once to the admin.

- **Session rotation & revocation** (`services/session.service.js`): every `/refresh` call atomically claims the presented refresh token (`findOneAndUpdate` on `revokedAt: null`) and issues a new one — a single-use, rotating token. Every token descended from one login shares a `familyId`. If a token is presented after it's already been rotated away (replay), the entire family is revoked, not just the single user account's other sessions — so a stolen-then-replayed token can't stay valid, but it also doesn't collaterally log out the user's unrelated devices. `logout` revokes the current session server-side (not just a cookie clear); a full password reset revokes **all** of a user's sessions, unscoped by family.

---

## 9. AI / intelligence layer

**`services/ai.service.js`** — two upstreams, both fail-soft:
- **Sentiment** (`analyzeSentiment`): HuggingFace `distilbert-base-uncased-finetuned-sst-2-english`. Returns `{ sentiment, score }`. No key → returns NEUTRAL. **8s timeout** via `AbortSignal.timeout`.
- **Structured JSON** (`callMistral`): NVIDIA-hosted `mistralai/mistral-small-...` via raw HTTPS to `integrate.api.nvidia.com`. Forces JSON with `response_format: {type:"json_object"}` + system prompt. `temperature 0.2`, `max_tokens 1024`. **20s timeout** via `req.setTimeout`. No key → rejects → caller falls back.

**`services/pm-insights.service.js`** — the richest analytics:
- Aggregates: sentiment stats, role breakdown, 7-day timeline, per-role samples.
- **Keyword clustering** (`CLUSTER_PATTERNS`) maps messages to labels: API Failure, Database Issue, Performance, UI/UX Bug, Data Pipeline, Authentication, Test Failures, Server Error. Severity by count (≥4 HIGH, ≥2 MEDIUM).
- Derives **affected teams** from engineering roles only (QA/FE/BE/DATA — never PM/ADMIN).
- Calls Mistral for `{ technicalSummary, businessSummary, actionBlock }`; if unavailable, `buildFallbackInsights` produces the same shape with rule-based text.
- **Per-org in-memory cache** keyed by feedback count — regenerates only when new feedback arrives. (In-memory ⇒ not shared across instances; see gotchas.)

**`services/decision-engine.service.js`:**
- `getOrgFeedbackContext(orgId)` pulls the last 80 feedback entries → compact per-role text block + sentiment counts + negative %.
- `generateDecisionInsight` feeds the PM's problem + that context to Mistral and returns a structured plan: `decisionTitle, confidence, rootCause, impact, affectedTeams, priorityLevel, recommendedActions[], riskIfIgnored, feedbackSignals[], edgeCases[], summary`.

**`services/analytics.service.js`:** simpler rule-based metrics (health score = `(POS−NEG)/total*100`, risk level, recency+sentiment priority scoring, most-impacted role). Backs `/analytics` and `/insights`.

---

## 10. Frontend

- **Routing** (`App.jsx`): public `/` (Landing), `/signin` (Login), `/signup` (Signup). Protected (via `ProtectedRoute`): `/hub`, `/decision-engine`, `/dashboard` (RoleSelector), `/dashboard/{pm,qa,fe,be,data}`.
- **API client** (`api/axios.js`): `baseURL = VITE_API_URL ?? http://localhost:4000/v1`, `withCredentials: true`. A **response interceptor** catches `401` on non-auth calls → clears `localStorage` (`user`, `organization`) → redirects to `/signin`.
- **Auth state:** cached in `localStorage` (`user`, `organization`); helpers in `utils/auth.js`. Cookies are the real auth; localStorage is just UI state.
- **Data hooks:** `useFeedback` (list + submit), `useInsights` (fetch `/pm-insights`) — shared across dashboards.
- **UX:** `ErrorBoundary` wraps the app; `DashboardNav` (unified nav + logout); `Toast` (a11y: `role=alert`); Recharts for visualizations.
- **Build:** Vite with manual vendor chunks (`react`, `charts`) so they cache independently; `sourcemap: false`. `VITE_API_URL` is inlined at build time and **must end in `/v1`**.

---

## 11. Configuration (environment variables)

Validated at boot by `config/env.js` (zod) — the process **exits with a readable
error** if a required var is missing/malformed.

**Backend**
| var | required | default | notes |
|---|---|---|---|
| `NODE_ENV` | — | development | development \| test \| production |
| `PORT` | — | 4000 | |
| `MONGO_URI` | ✅ | — | Mongo/Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | ≥16 chars |
| `ACCESS_TOKEN_TTL` | — | 15m | |
| `COOKIE_SECURE` | — | false | **true in production** (Secure + SameSite=None) |
| `CORS_ORIGIN` | — | http://localhost:5173 | comma-separated allowlist |
| `FRONTEND_URL` | — | http://localhost:5173 | used to build password-reset links |
| `HF_API_KEY` | — | — | optional (sentiment) |
| `NVIDIA_API_KEY` | — | — | optional (Mistral insights) |
| `RESEND_API_KEY` | — | — | optional (password-reset email); unset → forgot-password logs a warning and no-ops, still returns its generic success response |
| `EMAIL_FROM` | — | `PROD PILOT <onboarding@resend.dev>` | sender address; needs a verified domain in Resend for real delivery |
| `SENTRY_DSN` | — | — | optional (backend error monitoring); unset → Sentry SDK no-ops |

**Frontend**
| var | notes |
|---|---|
| `VITE_API_URL` | API base **including `/v1`**, inlined at build time |
| `VITE_SENTRY_DSN` | optional (frontend error monitoring); unset → Sentry SDK no-ops |

---

## 12. Running locally

```bash
# Backend (from repo root)
cp backend/.env.example backend/.env   # fill MONGO_URI + JWT secrets
npm install
npm run dev            # node --watch backend/src/server.js  → :4000

# Frontend
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:4000/v1
npm install
npm run dev            # Vite dev server → :5173
```
Requires a running MongoDB (local `mongodb://127.0.0.1:27017/prod_pilot` or Atlas).

---

## 13. Testing & CI

- **Tests** (`tests/`, Vitest + Supertest + mongodb-memory-server): `health.test.js`, `auth.test.js`, `feedback.test.js`. In-memory Mongo spun up/torn down globally (`tests/setup.js`) — isolated from real DB. Run: `npm test`.
- **Lint/format:** `npm run lint` (ESLint), `npm run format:check` (Prettier).
- **CI** (`.github/workflows/ci.yml`) on push/PR to `main`, Node 20: backend job (lint + format:check + test) and frontend job (lint + build).

Current state: **14/14 tests pass, lint clean, format clean, frontend builds.**

---

## 14. Deployment (chosen architecture)

Frontend → **Vercel/Netlify** (static SPA, rewrites to `index.html`). API →
**Render** (`render.yaml` blueprint: node, `npm ci`/`npm start`, health check,
auto-generated JWT secrets, `COOKIE_SECURE=true`). DB → **MongoDB Atlas**.
Full runbook + env checklist + troubleshooting in **`DEPLOYMENT.md`**.

**Critical production detail:** frontend and API are on different domains, so
auth cookies are **cross-site** → require `COOKIE_SECURE=true` + HTTPS + exact
`CORS_ORIGIN`. Works on Chrome/Edge/Firefox; Safari/Brave may block third-party
cookies. Robust fix = put both on subdomains of one parent domain.

---

## 15. Conventions & patterns

- **Layering:** route → controller (thin, `asyncHandler`) → service (logic) → model. Keep business logic in services.
- **Errors:** throw `ApiError.badRequest/unauthorized/forbidden/conflict/...`; the central `errorMiddleware` maps everything and never leaks internals (unknown → generic 500).
- **Validation:** every mutating/parametric route uses `validate({ body|query|params })` with a zod schema from `validators/`.
- **Logging:** `utils/logger.js` (pino), with redaction of auth headers/cookies/passwords/tokens. Use `logger`, not `console`.
- **Async external calls** must have timeouts and fail-soft fallbacks (see AI service).
- **CommonJS** in backend (`require`/`module.exports`); **ESM** in frontend.
- **Style:** Prettier-enforced; keep it green (`npm run format:check`).

---

## 16. Known gaps / gotchas (be careful here)

1. **Invite emails still aren't sent.** Invites return a temp password to the admin to share manually — unchanged. (Password reset, unlike invites, does send email — via Resend, see §8/§11.)
2. **In-memory caches & rate limiting.** PM-insights cache and express-rate-limit both use process memory → they do **not** share across multiple instances. On Render free (single instance) that's fine; if you scale horizontally, move to Redis.
3. **`/analytics` and `/insights` overlap.** Both expose rule-based aggregate insights; `/pm-insights` is the richer AI one. Consider consolidating.
4. **AI keys optional but features silently degrade.** No key → NEUTRAL sentiment + rule-based fallbacks. Good for resilience, but insights are weaker; verify keys are set in prod if you want the AI output.
5. **Free-tier cold starts** (Render) — first request after idle is slow.
6. **Clustering is keyword-based**, not ML — simple and predictable, but misses paraphrases.
7. **`decision` field is `Mixed`** — no schema enforcement on stored decision JSON; shape depends on the AI/fallback output.
8. **Sentry/Resend are both optional and silently no-op without a key.** `SENTRY_DSN`/`RESEND_API_KEY` unset → no error monitoring / no reset emails sent, but nothing crashes or blocks — verify both are actually set in prod, the same way you'd verify the AI keys (item 4).

---

## 17. Glossary — roles

`ADMIN` (org creator; treated as PM for feedback attribution), `PM` (product
manager; consumes insights + decision engine), `QA` / `FE` / `BE` / `DATA`
(engineering roles; the "affected teams" surfaced in insights).
