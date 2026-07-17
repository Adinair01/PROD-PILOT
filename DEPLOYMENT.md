# PROD PILOT — Production Deployment Guide

This guide takes PROD PILOT live with the architecture you chose:

```
  Browser
    │
    ├──────────────►  Frontend (static SPA)      Vercel or Netlify
    │                   Vite build → dist/         HTTPS, global CDN
    │
    └──────────────►  API (Express/Node)          Render (managed)
                        │                           HTTPS, /health checks
                        ▼
                      MongoDB Atlas               managed database
```

Frontend and API live on **different domains**, so the single most important
thing to get right is **cross-site auth cookies** (see step 5). Everything else
is standard.

---

## 0. Prerequisites

- A GitHub repo with this code pushed to `main`.
- Accounts: [MongoDB Atlas](https://www.mongodb.com/atlas), [Render](https://render.com), and [Vercel](https://vercel.com) **or** [Netlify](https://netlify.com). All have free tiers.
- (Optional) API keys for AI features: [HuggingFace](https://huggingface.co/settings/tokens) and [NVIDIA NIM](https://build.nvidia.com). The app runs without them and degrades gracefully.
- (Optional) [Resend](https://resend.com/api-keys) for password-reset email, and [Sentry](https://sentry.io) for error monitoring. Both are optional — unset, the app just skips them (no reset emails sent / no error reporting), it doesn't fail to start or serve requests.

---

## 1. Database — MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → add a database user (username + strong password). Save these.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere). Render's egress IPs are dynamic on the free plan, so this is the pragmatic choice. Tighten to Render's static IPs later if you upgrade.
4. **Connect** → **Drivers** → copy the SRV connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/prod_pilot?retryWrites=true&w=majority
   ```
   Replace `<user>`/`<password>`, and put the database name (`prod_pilot`) before the `?`. This is your **`MONGO_URI`**.

---

## 2. API — deploy to Render

The repo includes [`render.yaml`](./render.yaml), a Blueprint that provisions the
service for you.

1. Render → **New +** → **Blueprint** → select this repo. Render reads `render.yaml`.
2. It auto-generates `JWT_ACCESS_SECRET`. You'll be
   prompted for the `sync: false` secrets — set:
   | Variable | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string from step 1 |
   | `CORS_ORIGIN` | your frontend URL — **fill in after step 3** (e.g. `https://prodpilot.vercel.app`) |
   | `FRONTEND_URL` | same frontend URL — used to build password-reset links |
   | `HF_API_KEY` | optional |
   | `NVIDIA_API_KEY` | optional |
   | `RESEND_API_KEY` / `EMAIL_FROM` | optional — unset, password reset silently skips sending email |
   | `SENTRY_DSN` | optional — unset, no error monitoring |
3. Deploy. When live, note the API URL, e.g. `https://prodpilot-api.onrender.com`.
4. Verify:
   ```bash
   curl https://prodpilot-api.onrender.com/health         # {"status":"ok"}
   curl https://prodpilot-api.onrender.com/health/ready    # {"status":"ready","db":"up"}
   ```
   If `/health/ready` reports `db:"down"`, your `MONGO_URI` or Atlas Network
   Access is wrong.

> **Free-tier note:** Render's free web service sleeps after ~15 min idle, so the
> first request after a nap takes a few seconds (cold start). Upgrade to a paid
> instance for always-on.

**Railway alternative:** Railway auto-detects the Node app — no config file
needed. Set the same environment variables in the Railway dashboard and use
start command `npm start`. Everything else in this guide is identical.

---

## 3. Frontend — deploy to Vercel (or Netlify)

The API base URL is baked into the build via `VITE_API_URL`, so it **must be set
before/at build time** and **must end in `/v1`**.

### Vercel
1. Vercel → **Add New** → **Project** → import this repo.
2. **Root Directory** → set to `frontend`. Vercel auto-detects Vite.
3. **Environment Variables** → add:
   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://prodpilot-api.onrender.com/v1` (your API URL **+ `/v1`**) |
4. Deploy. The included [`frontend/vercel.json`](./frontend/vercel.json) rewrites
   all routes to `index.html` so client-side routing survives a page refresh.
5. Note the frontend URL, e.g. `https://prodpilot.vercel.app`.

### Netlify (alternative)
1. Netlify → **Add new site** → import this repo. It reads [`netlify.toml`](./netlify.toml) (base `frontend`, publish `dist`, SPA redirect included).
2. **Site settings → Environment variables** → add `VITE_API_URL` = `https://…/v1`.
3. Deploy.

---

## 4. Wire the two together

After both are live, close the loop:

1. Set the API's **`CORS_ORIGIN`** (in Render) to the **exact** frontend origin —
   scheme + host, **no trailing slash, no path**:
   ```
   CORS_ORIGIN=https://prodpilot.vercel.app
   ```
   (For multiple origins, comma-separate them.)
2. Confirm the frontend's **`VITE_API_URL`** points at the API **with `/v1`**.
3. Redeploy whichever side you changed.

---

## 5. ⚠️ Cross-site auth cookies (read this)

Auth uses **httpOnly cookies**. Because the frontend (`*.vercel.app`) and API
(`*.onrender.com`) are on **different registrable domains**, the browser treats
the auth cookie as **cross-site** and will only store/send it when **all** of
these hold — the code already does its part; you supply the deploy conditions:

| Requirement | Who handles it |
|---|---|
| `SameSite=None` on the cookie | ✅ code sets this automatically when `COOKIE_SECURE=true` |
| `Secure` on the cookie | ✅ same — and both hosts serve HTTPS |
| `COOKIE_SECURE=true` in the API env | **you** (already in `render.yaml`) |
| `CORS_ORIGIN` = exact frontend origin, `credentials` on | ✅ code + your `CORS_ORIGIN` |

With this, login works on **Chrome, Edge, and Firefox** out of the box.

**Caveat:** Safari/Brave and any browser set to *block third-party cookies* may
drop cross-site cookies, breaking login. To be bulletproof across all browsers,
put both apps on **one parent domain** using subdomains:

```
Frontend →  https://app.prodpilot.com     (Vercel custom domain)
API      →  https://api.prodpilot.com      (Render custom domain)
CORS_ORIGIN = https://app.prodpilot.com
VITE_API_URL = https://api.prodpilot.com/v1
```

Same-parent-domain requests are **first-party**, so third-party-cookie blocking
never applies. Add the custom domains in each host's dashboard, point DNS, and
update `CORS_ORIGIN` + `VITE_API_URL`. No code changes needed.

---

## 6. Production environment checklist

**API (Render) — required**

| Variable | Value / rule |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas SRV string |
| `JWT_ACCESS_SECRET` | ≥16 random chars (Render auto-generates) |
| `COOKIE_SECURE` | `true` |
| `CORS_ORIGIN` | exact frontend origin(s) |
| `FRONTEND_URL` | exact frontend origin — used to build password-reset links |

**API — optional (sensible defaults)**

| Variable | Default |
|---|---|
| `PORT` | injected by Render |
| `ACCESS_TOKEN_TTL` | `15m` |
| `HF_API_KEY` / `NVIDIA_API_KEY` | unset → AI features degrade gracefully |
| `RESEND_API_KEY` / `EMAIL_FROM` | unset → password reset returns its normal response but sends no email |
| `SENTRY_DSN` | unset → no error monitoring, everything else unaffected |

The API **validates all of this at boot** (`backend/src/config/env.js`) and
exits with a readable error if anything required is missing or malformed — so a
misconfigured deploy fails fast and loudly instead of at request time.

**Frontend (Vercel/Netlify)**

| Variable | Value |
|---|---|
| `VITE_API_URL` | API URL **ending in `/v1`** |
| `VITE_SENTRY_DSN` | optional — unset, no frontend error monitoring |

---

## 7. Go-live checklist

- [ ] Atlas cluster up; DB user created; Network Access allows Render.
- [ ] API deployed; `GET /health/ready` returns `db:"up"`.
- [ ] `COOKIE_SECURE=true` on the API.
- [ ] `CORS_ORIGIN` = exact frontend origin (no trailing slash).
- [ ] Frontend deployed; `VITE_API_URL` ends in `/v1`.
- [ ] Sign up an admin, log in, submit feedback, load a dashboard — end to end.
- [ ] Open DevTools → Application → Cookies: `accessToken` present with
      `Secure` + `SameSite=None` after login.
- [ ] Refresh a deep link (e.g. `/dashboard/pm`) — no 404 (SPA rewrite works).
- [ ] (If using custom domains) DNS resolves; certs issued; envs updated.

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Login succeeds but you're bounced back to sign-in | Cross-site cookie not stored. Verify `COOKIE_SECURE=true`, HTTPS on both, and try Chrome to rule out third-party-cookie blocking. Best fix: custom subdomains (step 5). |
| Browser console: **CORS** error | `CORS_ORIGIN` doesn't exactly match the frontend origin (trailing slash / http vs https / wrong subdomain). |
| API calls 404 | `VITE_API_URL` missing the `/v1` suffix, or wrong host. |
| `/health/ready` → `db:"down"` | Bad `MONGO_URI` or Atlas Network Access not allowing Render. |
| API won't boot; logs show env errors | A required var is missing/short (secrets must be ≥16 chars). See the boot error — it names the field. |
| First request slow | Render free-tier cold start. Upgrade the instance or ping `/health` on a schedule. |
| `429 Too many requests` | Rate limit (120/min global; 20/min on auth & decision-engine). Expected under load/abuse. |
