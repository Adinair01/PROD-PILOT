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
   | `RESEND_API_KEY` / `EMAIL_FROM` | optional — but see the warning below: a key **without** `EMAIL_FROM` still fails to deliver |
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

The frontend calls a **same-origin** `/v1`, which the host forwards to the API.
That keeps auth cookies first-party — see [section 5](#5-️-auth-cookies-read-this).
**Leave `VITE_API_URL` unset**; it only exists to aim a build at a different backend.

### Vercel
1. Vercel → **Add New** → **Project** → import this repo.
2. **Root Directory** → set to `frontend`. Vercel auto-detects Vite.
3. **Environment Variables** → nothing required for the API URL. If a
   `VITE_API_URL` is already set there, **delete it** — it is inlined at build
   time and overrides the proxy, which reintroduces third-party cookies.
4. Edit the API host in [`frontend/vercel.json`](./frontend/vercel.json) if your
   backend is not `prodpilot-backend.onrender.com`. That file both proxies
   `/v1/*` to the API and rewrites everything else to `index.html`, so
   client-side routing survives a page refresh. Order matters: `/v1` first.
5. Deploy, and note the frontend URL, e.g. `https://prodpilot.vercel.app`.

### Netlify (alternative)
1. Netlify → **Add new site** → import this repo. It reads [`netlify.toml`](./netlify.toml) (base `frontend`, publish `dist`, `/v1/*` API proxy and SPA redirect included).
2. Edit the API host in the `/v1/*` redirect if yours differs. Leave `VITE_API_URL` unset.
3. Deploy.

---

## 4. Wire the two together

After both are live, close the loop:

1. Set the API's **`CORS_ORIGIN`** (in Render) to the **exact** frontend origin —
   scheme + host, **no trailing slash, no path**:
   ```
   CORS_ORIGIN=https://prodpilot.vercel.app
   ```
   (For multiple origins, comma-separate them.) The proxy makes browser requests
   same-origin, but this stays correct and is still used for any direct calls.
2. Set **`TRUST_PROXY_HOPS=2`** in Render — Render's load balancer is one hop and
   the frontend proxy is a second. See [section 5](#5-️-auth-cookies-read-this).
3. Confirm no `VITE_API_URL` is set on the frontend host.
4. Redeploy whichever side you changed.

---

## 5. ⚠️ Auth cookies (read this)

Auth uses **httpOnly cookies**, and cookies are scoped by *site*, not by URL. If
the browser calls the API's own domain (`*.onrender.com`) from a page served by
`*.vercel.app`, those are **different registrable domains**, so the cookie is
**third-party**. Safari and Brave block third-party cookies by default and Chrome
is phasing them out — the cookie is silently dropped, every request comes back
401, and the user is bounced to sign-in no matter how correct the token logic is.

**The fix is to never make a cross-site request.** The frontend calls a
same-origin `/v1`, and the host rewrites it to the API server-side:

```
Browser  ──►  https://prodpilot.vercel.app/v1/...   (first-party cookie)
Vercel   ──►  https://prodpilot-backend.onrender.com/v1/...
```

The browser only ever sees one origin, so the cookie is first-party and no
third-party-cookie policy applies. This works on the free `*.vercel.app` domain —
no custom domain required.

| Requirement | Who handles it |
|---|---|
| `/v1/*` proxied to the API | ✅ [`frontend/vercel.json`](./frontend/vercel.json) / [`netlify.toml`](./netlify.toml) |
| App calls a relative `/v1` | ✅ code default — **keep `VITE_API_URL` unset** |
| Same `/v1` path locally | ✅ dev-server proxy in `frontend/vite.config.js` |
| `Secure` on the cookie | ✅ set when `COOKIE_SECURE=true`; both hosts serve HTTPS |
| `TRUST_PROXY_HOPS` matches the chain | **you** — `2` behind the proxy |
| `COOKIE_SAMESITE=lax` once proxied | **you** — optional hardening, see below |

**`TRUST_PROXY_HOPS` is not optional.** The app resolves client IPs from
`X-Forwarded-For` to rate-limit per user. Adding the proxy adds a hop, so at the
old value of `1` every request resolves to *Vercel's* egress IP and all users
share one bucket — the 20-req/min auth limiter then 429s everyone at once.

**Optional hardening:** with the API same-origin, the cookie no longer needs
`SameSite=None` (which exists purely to permit cross-site sending). Set
**`COOKIE_SAMESITE=lax`** in Render for real CSRF protection. Do this *after*
confirming the proxy works — flipping it while any client still calls the API
cross-site would drop that client's cookies immediately.

**Alternative:** custom subdomains (`app.` + `api.` on one parent domain) also
make requests first-party, if you'd rather not proxy. Then set `VITE_API_URL` to
the API subdomain and leave `TRUST_PROXY_HOPS=1`.

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
| `TRUST_PROXY_HOPS` | `2` when the frontend proxies `/v1` (Render LB + frontend proxy) |

**API — optional (sensible defaults)**

| Variable | Default |
|---|---|
| `PORT` | injected by Render |
| `ACCESS_TOKEN_TTL` | `15m` |
| `COOKIE_SAMESITE` | unset → `none` in production. Set to `lax` once `/v1` is proxied |
| `HF_API_KEY` / `NVIDIA_API_KEY` | unset → AI features degrade gracefully |
| `RESEND_API_KEY` / `EMAIL_FROM` | unset → password reset returns its normal response but sends no email. **Setting only the key is a trap** — see below |
| `SENTRY_DSN` | unset → no error monitoring, everything else unaffected |

The API **validates all of this at boot** (`backend/src/config/env.js`) and
exits with a readable error if anything required is missing or malformed — so a
misconfigured deploy fails fast and loudly instead of at request time. It also
logs a `[env]` warning for variables that are set but unread (a typo like
`CORS_ORIGINS`, or a leftover like `JWT_SECRET`), since those otherwise fail
silently by simply having no effect. Worth a glance in the deploy log.

### ⚠️ Password-reset email needs a verified domain

Setting `RESEND_API_KEY` alone is **not enough**. Without `EMAIL_FROM`, the app
falls back to `onboarding@resend.dev` — Resend's shared test sender, which only
delivers to the email address that owns the Resend account. Every other user
gets the normal "check your inbox" response and no email, because the reset flow
deliberately returns an identical response either way so the endpoint can't be
used to discover which addresses have accounts.

To actually deliver: verify your domain in Resend, then set
`EMAIL_FROM="PROD PILOT <noreply@yourdomain.com>"`. The rejection is logged
(`[Email] Resend rejected the password reset email`), so check the Render logs
after a test reset rather than trusting the UI response.

**Frontend (Vercel/Netlify)**

| Variable | Value |
|---|---|
| `VITE_API_URL` | **leave unset** — the app uses the same-origin `/v1` proxy. Setting it re-creates the third-party-cookie bug |
| `VITE_SENTRY_DSN` | optional — unset, no frontend error monitoring |

---

## 7. Go-live checklist

- [ ] Atlas cluster up; DB user created; Network Access allows Render.
- [ ] API deployed; `GET /health/ready` returns `db:"up"`.
- [ ] `COOKIE_SECURE=true` on the API.
- [ ] `CORS_ORIGIN` = exact frontend origin (no trailing slash).
- [ ] Frontend deployed with **no** `VITE_API_URL` set.
- [ ] `TRUST_PROXY_HOPS=2` on the API.
- [ ] `curl https://<frontend>/v1/health` returns the API's JSON, not HTML —
      proves the proxy beat the SPA fallback rather than serving `index.html`.
- [ ] Sign up an admin, log in, submit feedback, load a dashboard — end to end.
- [ ] Open DevTools → Application → Cookies: `accessToken` listed under the
      **frontend's** origin after login (that's what makes it first-party).
- [ ] Repeat the login in **Safari** — the browser that blocks third-party
      cookies, so it's the one that proves the proxy is doing its job.
- [ ] Leave a tab idle >15 min, then click a dashboard — it should load, not
      bounce to sign-in (silent token refresh working).
- [ ] Refresh a deep link (e.g. `/dashboard/pm`) — no 404 (SPA rewrite works).
- [ ] (If using custom domains) DNS resolves; certs issued; envs updated.

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Login succeeds but you're bounced back to sign-in, mostly in Safari | Third-party cookie blocked. The browser is talking to the API's domain directly instead of the same-origin proxy — check that `VITE_API_URL` is **unset** on the frontend host and that `/v1/health` on the frontend origin returns JSON (step 5). |
| Bounced to sign-in after ~15 min idle, any browser | Silent refresh not running. `/v1/auth/refresh` must be reachable and the refresh cookie's path (`/v1/auth/refresh`) must match the path the browser requests. |
| Browser console: **CORS** error | `CORS_ORIGIN` doesn't exactly match the frontend origin (trailing slash / http vs https / wrong subdomain). Proxied calls are same-origin and shouldn't hit CORS at all — if they do, the proxy isn't matching. |
| API calls return HTML instead of JSON | The SPA fallback caught `/v1/*` first. The `/v1` rule must come **before** the catch-all rewrite. |
| `/health/ready` → `db:"down"` | Bad `MONGO_URI` or Atlas Network Access not allowing Render. |
| API won't boot; logs show env errors | A required var is missing/short (secrets must be ≥16 chars). See the boot error — it names the field. |
| First request slow (~30s) | Render free-tier cold start. `.github/workflows/keepalive.yml` pings `/health` every 10 min to prevent it; a paid instance removes it entirely. |
| `429 Too many requests` for everyone at once | `TRUST_PROXY_HOPS` doesn't match the real proxy chain, so all users share one rate-limit bucket. Set it to `2` behind the frontend proxy. |
| `429` for a single user under load | Rate limit working as intended (120/min global; 20/min on auth & decision-engine). |
