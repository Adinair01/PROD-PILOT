# PROD PILOT — Frontend

React + Vite single-page app for PROD PILOT. It provides the landing page, authentication, the role dashboards, and the Decision Engine UI.

## Tech

- **React 19** with **React Router 7**
- **Vite 7** (dev server + build)
- **Recharts** for visualizations, **lucide-react** for icons
- **Axios** with `withCredentials` for cookie-based auth

## Setup

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if your backend isn't on localhost:4000
npm install
npm run dev            # http://localhost:5173
```

The backend must be running (see the root [README](../README.md)) for auth and data.

## Environment

| Variable       | Default                      | Description                          |
| -------------- | ---------------------------- | ------------------------------------ |
| `VITE_API_URL` | `http://localhost:4000/v1`   | Base URL of the backend API (`/v1`). |

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR.  |
| `npm run build`   | Production build to `dist/`.         |
| `npm run preview` | Preview the production build.        |
| `npm run lint`    | Lint with ESLint.                    |

## Structure

```
src/
├── api/         Axios instance + global 401 handling
├── components/  Shared UI (DashboardNav, ProtectedRoute, ErrorBoundary, Toast, loaders)
├── hooks/       Data hooks (useFeedback, useInsights)
├── pages/       Routed views (Landing, Login, Signup, Hub, dashboards, DecisionEngine)
├── utils/       Auth/session helpers and small utilities
└── styles/      Page-scoped CSS
```

Authenticated routes are wrapped in `ProtectedRoute`; the axios interceptor clears the session and redirects to `/signin` on a `401`.
