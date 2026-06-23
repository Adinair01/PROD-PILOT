# PROD PILOT — Quick Start

Get the full stack running locally in a few minutes.

## Prerequisites

- Node.js 18+ (an `.nvmrc` pins 20)
- MongoDB running locally, or a MongoDB Atlas connection string

## 1. Backend

From the repository root:

```bash
cp backend/.env.example backend/.env   # then edit the values
npm install
npm run dev
```

Set at least these in `backend/.env`:

| Variable             | Notes                                              |
| -------------------- | -------------------------------------------------- |
| `MONGO_URI`          | Local Mongo or an Atlas URI.                       |
| `JWT_ACCESS_SECRET`  | Long random string (min 16 chars).                 |
| `JWT_REFRESH_SECRET` | Different long random string.                      |
| `CORS_ORIGIN`        | `http://localhost:5173` for local dev.             |
| `HF_API_KEY`         | Optional — sentiment falls back to NEUTRAL if unset. |
| `NVIDIA_API_KEY`     | Optional — AI summaries fall back to rule-based.   |

The server validates the environment on boot and exits with a clear message if anything required is missing. You should see `MongoDB connected` and `API running on :4000`.

## 2. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if the backend isn't on localhost:4000
npm install
npm run dev
```

Open **http://localhost:5173**.

## 3. First run

1. Click **Create your organization** and complete signup (name, email, password ≥ 8 chars, organization name). Signup bootstraps your org and its first admin, and logs you in.
2. You land on the **Hub** — choose **Feedback Intelligence** or the **Decision Engine**.
3. **Feedback Intelligence** opens the role selector. Pick a role (PM, QA, Frontend, Backend, Data) to open that dashboard.
4. Submit feedback from any dashboard. Sentiment is scored automatically and aggregated insights update on the PM dashboard.
5. Open the **Decision Engine** to generate a structured, feedback-grounded action plan for a problem statement.

## Verifying the backend

```bash
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Vitest + Supertest (in-memory MongoDB)
```

## Troubleshooting

- **Server won't start** — read the boot error; a missing/short `JWT_*` secret or absent `MONGO_URI` will halt startup by design.
- **Login/requests fail with CORS errors** — ensure `CORS_ORIGIN` matches the frontend origin exactly.
- **Charts are empty** — submit some feedback first; insights are derived from real entries.
