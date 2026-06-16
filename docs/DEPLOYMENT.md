# InsightX AI — Production Deployment Guide

## Can you use `http://20.2.92.40:8000`?

**No — not as the InsightX backend API.**

That URL is the **standalone Detectra AI dashboard** (v4.1 Pro UI) — a separate product with its own HTML interface and job APIs (`/api/jobs/...`). InsightX does **not** call Detectra over HTTP.

| Service | URL example | Purpose |
|---------|-------------|---------|
| **Detectra standalone** | `http://20.2.92.40:8000/` | Detectra-only surveillance dashboard |
| **InsightX backend** | `https://api.your-domain.com` or `http://20.2.92.40:8001` | FastAPI — auth, investigations, upload, chat, reports |
| **InsightX frontend** | `https://your-app.vercel.app` | Next.js dashboard |

InsightX runs Detectra **in-process** by importing `DetectraAnalyzer` from Python files on the same server (`DETECTRA_ENGINE_PATH`).

### Recommended: same VM, two services

You already have an Azure VM at `20.2.92.40`. **Keep Detectra on port 8000** and deploy **InsightX backend on port 8001** (or behind Nginx with HTTPS):

```
20.2.92.40:8000  →  Detectra standalone (already deployed)
20.2.92.40:8001  →  InsightX FastAPI backend (new)
Vercel           →  InsightX frontend
```

On that VM, set:

```env
DETECTRA_ENGINE_PATH=/path/to/detectra-ai/backend
```

Point to the Detectra **source code** already on the machine — not the HTTP URL.

---

## Architecture (Production)

```
Vercel (HTTPS)
  NEXT_PUBLIC_API_URL=https://api.insightx.yourdomain.com
        │
        ▼
InsightX Backend (FastAPI + Detectra engine on disk)
  ├── PostgreSQL (Supabase / Neon)
  ├── Supabase Storage (videos)
  └── LLM keys (Groq, Gemini, etc.)
```

---

## Part 1 — Frontend on Vercel

### 1. Connect repository

1. Push `insightx-ai` to GitHub.
2. [Vercel](https://vercel.com) → **Add New Project** → import repo.
3. Set **Root Directory** to `frontend`.

### 2. Environment variables (Vercel dashboard)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_WS_URL` | `wss://api.yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

> Use **HTTPS/WSS** in production. Browsers block mixed content (HTTPS page → HTTP API).

### 3. Deploy

Vercel runs `npm run build` automatically. No extra config needed (`vercel.json` included).

---

## Part 2 — Backend on your VM (20.2.92.40 or Oracle/Fly.io)

### Option A — Same Azure VM (recommended if you already pay for it)

```bash
# SSH into 20.2.92.40
git clone <your-insightx-repo>
cd insightx-ai/backend

# Install system deps
sudo apt update && sudo apt install -y ffmpeg python3.12-venv

python3 -m venv venv && source venv/bin/activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Configure .env (see backend/.env.example)
cp .env.example .env
nano .env
```

**Critical `.env` values:**

```env
DATABASE_URL=postgresql+asyncpg://...@db.supabase.co:5432/postgres
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app
DETECTRA_ENGINE_PATH=/home/ubuntu/detectra-ai/backend
STORAGE_BACKEND=supabase
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...
GROQ_API_KEY=...
SECRET_KEY=<random-256-bit>
```

```bash
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
```

Open Azure NSG: allow inbound **8001** (or 443 via Nginx).

### Option B — Docker on VM

```bash
cd insightx-ai
cp .env.example .env
# Edit .env — set DETECTRA_ENGINE_PATH volume mount to detectra code

docker compose up -d --build
docker compose exec backend alembic upgrade head
```

Map host port `8001:8000` if Detectra already uses 8000.

### Option C — Oracle Cloud Always Free (separate server)

Same Docker steps; bundle Detectra source in the image or mount volume.

---

## Part 3 — HTTPS (required for Vercel)

Vercel frontend is HTTPS. Your API must be HTTPS too.

**Nginx + Let's Encrypt on 20.2.92.40:**

```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        client_max_body_size 4096M;
    }
}
```

Point DNS `api.yourdomain.com` → `20.2.92.40`.

Then set on Vercel:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

---

## Part 4 — Database & Storage

| Service | Provider | Free tier |
|---------|----------|-----------|
| PostgreSQL | [Supabase](https://supabase.com) | Yes |
| Video files | Supabase Storage | Yes |
| Auth | Supabase + FastAPI JWT | Yes |

Set `STORAGE_BACKEND=supabase` — do not rely on local disk on Vercel/serverless.

---

## Part 5 — Verify deployment

```bash
# Health
curl https://api.yourdomain.com/health

# From your machine
cd insightx-ai
python scripts/e2e_api_test.py   # set BASE in script to your API URL
```

Browser checks:

1. `https://your-app.vercel.app` — landing page  
2. Register / login  
3. Create investigation → upload video  
4. Live progress bar completes  
5. Chat + PDF export work  

---

## Checklist

- [ ] InsightX backend deployed ( **not** the Detectra dashboard URL)
- [ ] `DETECTRA_ENGINE_PATH` points to Detectra **Python code** on server
- [ ] PostgreSQL + migrations applied
- [ ] `ALLOWED_ORIGINS` includes Vercel URL
- [ ] API served over **HTTPS**
- [ ] Vercel env vars set (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`)
- [ ] Supabase storage configured for uploads
- [ ] Azure NSG / firewall ports open
- [ ] LLM API keys set (Groq minimum)

---

## Summary

| Question | Answer |
|----------|--------|
| Use `http://20.2.92.40:8000` for InsightX frontend API? | **No** — wrong app |
| Reuse the same VM? | **Yes** — run InsightX on port **8001** + HTTPS |
| New deployment needed? | **Yes** — deploy **InsightX backend** separately |
| Detectra deployment wasted? | **No** — reuse Detectra **code** on disk via `DETECTRA_ENGINE_PATH` |
