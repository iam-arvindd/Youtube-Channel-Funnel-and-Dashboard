# Wealth Studio — Faceless Finance YouTube Command Center

A single-user, modern dashboard to run a faceless finance YouTube channel end-to-end: ideas, AI scripting, production pipeline, thumbnails, analytics, affiliate income and publishing calendar — all in one place.

Built with **React (CRA) + FastAPI + MongoDB**, themed in a premium light + dark palette, animated with Framer Motion, and integrated with Claude, Gemini Nano Banana, YouTube Data/Analytics APIs and Resend.

---

## Features

- **JWT Auth** — single-user, no public signup
- **Idea Vault** — 50 pre-seeded finance topics, CRUD, rating, niche filtering
- **Pipeline Kanban** — drag cards across 6 stages: Idea → Script → Voiceover → Video → Thumbnail → Published
- **Claude Sonnet 4.6 Script Generator** — streaming chat tied to each video (bring your own Anthropic key)
- **Object Storage Uploads** — thumbnail PNG + voiceover MP3 via Emergent storage
- **Script Export** — download as `.txt` or `.docx`
- **YouTube Data API** — auto-pull views / CTR per video + one-click "Sync All"
- **YouTube Analytics API** (OAuth 2.0) — retention curves, traffic sources, summary metrics
- **AI Thumbnail Generator** — Gemini Nano Banana
- **Thumbnail A/B Tracker** — AI vs Human variants with CTR winner highlighting
- **Affiliates Tracker** — Groww / Zerodha / Upstox / Amazon income per month
- **Analytics Dashboard** — earnings, views, RPM, subs gained, retention
- **Calendar** — publishing schedule view
- **Weekly Email Digest** — RPM + affiliate income via Resend (toggleable)
- **Dark Mode** — animated sidebar toggle, persisted across sessions

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 19 (CRA + craco), Tailwind CSS, Shadcn UI, Framer Motion, Phosphor Icons |
| Backend | FastAPI, Motor (MongoDB async), PyJWT, Fernet encryption, python-docx |
| Database | MongoDB |
| AI | Anthropic Claude Sonnet 4.6 (user key), Gemini Nano Banana (Emergent LLM key) |
| Integrations | YouTube Data API, YouTube Analytics API (OAuth2), Resend, Emergent Object Storage |

---

## Project Structure

```
/app
├── backend/
│   ├── server.py            # All API routes (auth, ideas, pipeline, claude, youtube, resend, thumbnails)
│   ├── requirements.txt
│   └── .env                 # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_PASSWORD, EMERGENT_LLM_KEY, ...
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Vault, Pipeline, Analytics, Affiliates, Calendar, Settings, Login
│   │   ├── components/      # Shell, Sidebar, ui/* (shadcn)
│   │   ├── lib/             # api.js, auth.jsx, theme.jsx
│   │   ├── App.js
│   │   └── index.css
│   ├── package.json
│   └── .env                 # REACT_APP_BACKEND_URL
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

---

## Local Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
# Fill backend/.env (see "Environment Variables" below)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 2. Frontend

```bash
cd frontend
yarn install
# Fill frontend/.env with REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

App opens at `http://localhost:3000`.

---

## Environment Variables

### `backend/.env`

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=wealth_studio
JWT_SECRET=<long-random-string>
ADMIN_EMAIL=admin@dashboard.local
ADMIN_PASSWORD=<your-password>
API_KEY_ENCRYPTION_KEY=<fernet-key>
EMERGENT_LLM_KEY=<provided-by-emergent>
CORS_ORIGINS=*
```

### `frontend/.env`

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

> **Note:** All API routes are prefixed with `/api`. The frontend uses `process.env.REACT_APP_BACKEND_URL` for every request.

---

## User-Supplied API Keys (set inside the app → Settings)

| Service | Where to get | Why |
|---|---|---|
| **Anthropic API key** | https://console.anthropic.com | Claude script generation |
| **Resend API key** | https://resend.com/api-keys | Weekly email digests |
| **YouTube Data API key** | https://console.cloud.google.com (Enable YouTube Data API v3) | Public stats sync |
| **YouTube OAuth Client ID + Secret** | https://console.cloud.google.com (OAuth 2.0 Client, type "Web") | Channel analytics + retention |

> The Anthropic/Resend/YouTube keys are encrypted with Fernet before being stored in MongoDB.

---

## Default Admin Credentials

```
Email:    admin@dashboard.local
Password: finance2026
```

Change `ADMIN_PASSWORD` in `backend/.env` before deploying to production.

---

## Key API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/ideas                      # list (filter by status)
POST   /api/ideas                      # create
PUT    /api/ideas/{id}
PUT    /api/ideas/{id}/status          # kanban move
POST   /api/claude/chat                # streaming script gen
POST   /api/upload                     # object storage
GET    /api/export/script              # .txt or .docx
GET    /api/youtube/sync               # single video
POST   /api/youtube/sync-all           # bulk
GET    /api/youtube/oauth/start
GET    /api/youtube/oauth/callback
GET    /api/youtube/analytics
POST   /api/thumbnail/generate         # Nano Banana
POST   /api/settings/digest            # Resend toggle
```

---

## Theming

- Light: bone white `#F8F9F7` + deep pine `#00594C` + terracotta `#FF6B4A`
- Dark: `#0B0F0E` base + emerald `#00E599` accents
- Toggle persisted in `localStorage` under key `ws-theme`

---

## Deployment

- **One-click (recommended):** Use the **Deploy** button in the Emergent chat panel — ships React + FastAPI + Mongo together.
- **Split deployment:** Frontend on Vercel + Backend on Railway/Render + MongoDB Atlas (requires manual env wiring).

---

## License

Personal / private use. All trademarks belong to their respective owners.
