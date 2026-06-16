# InsightX AI — AI Investigation & Evidence Intelligence Platform

**Final Year Project · University of Central Punjab**  
**Authors:** Ahmad Yasin · Abdul Rehman

---

## 1. Project Overview & Problem Solved

Manual review of CCTV and body-worn video is slow, inconsistent, and error-prone. Security teams, investigators, and compliance officers often spend **hours per clip** searching for persons, vehicles, incidents, and spoken evidence — while critical events are missed due to fatigue and fragmented tooling.

**InsightX AI** solves this by transforming raw surveillance footage into **forensic-grade intelligence in minutes**:

- Upload video evidence into structured **investigations**
- Run a **multimodal AI pipeline** (Detectra v7 + YOLO + Whisper + anomaly detection)
- Receive **incident scores**, timelines, anomaly alerts, and executive briefs
- Interrogate evidence via an **AI Chat Investigator** (Groq → Gemini → HuggingFace → Anthropic fallback chain)
- Export **PDF / JSON / CSV** reports for stakeholders

**Target outcome:** Reduce evidence review time from hours to minutes while improving consistency, auditability, and decision quality.

---

## 2. System Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    Next.js 15 Frontend (Vercel / Docker)
                    ├── Landing · Auth · Dashboard
                    ├── Live Analysis WebSocket + HTTP polling
                    └── API proxy: /api/* → Backend
                                │
                    FastAPI Backend (Python 3.12)
                    ├── JWT + Supabase Auth
                    ├── PostgreSQL (investigations, evidence, results)
                    ├── Background analysis worker
                    └── LLM service (multi-provider)
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   Detectra v7 Engine    Built-in Pipeline      External LLM APIs
   (YOLO·Pose·OCR·       (YOLOv8 + Whisper +    (Groq, Gemini,
    Whisper·Fusion)       fallback rules)         HF, Anthropic)
          │                     │
          └──────────┬──────────┘
                     ▼
            Analysis Results → DB → Reports / Chat / Timeline
```

**Data flow (video analysis):**

1. User uploads MP4/AVI/MOV via dashboard  
2. Backend stores file → creates `AnalysisJob` → runs worker in background  
3. `AnalysisPipelineOrchestrator` executes Detectra v7 (primary) or built-in pipeline (fallback)  
4. Progress streamed via WebSocket `/api/v1/analysis/ws/{job_id}`  
5. Results persisted → investigation score rolled up → UI refreshes  

---

## 3. Tools & Technologies Used

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion, Recharts, Zustand, TanStack Query, Axios |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2 (async), Alembic, asyncpg |
| **Database** | PostgreSQL 16, Redis 7 |
| **Auth** | FastAPI JWT (bcrypt + python-jose), Supabase Auth (Google OAuth + JWT validation) |
| **AI / CV** | PyTorch, Ultralytics YOLOv8, faster-whisper, OpenCV, EasyOCR, ByteTrack |
| **Video Engine** | Detectra AI v7 (external bridge) |
| **LLM Providers** | Groq, Google Gemini, HuggingFace Inference, Anthropic Claude |
| **Reports** | ReportLab (PDF), Pandas (CSV), JSON export |
| **DevOps** | Docker, Docker Compose, Nginx, pytest |
| **Deployment** | Vercel (frontend), Oracle Cloud / Fly.io / Render (backend recommended) |

### AI Models

| Model | Purpose |
|-------|---------|
| YOLOv8s-seg | Object detection + segmentation |
| YOLOv8n-pose | Pose / action recognition |
| faster-whisper-medium | Speech-to-text |
| ByteTrack | Multi-object tracking |
| Detectra Fusion Transformer | Multimodal anomaly scoring |
| Groq Llama 3.3 70B | Primary chat / reasoning |
| Gemini 2.0 Flash | Chat fallback |
| BLIP / Qwen2-VL | Optional VLM scene captions |

---

## 4. Folder Structure

```
insightx-ai/
├── backend/                      # FastAPI application
│   ├── main.py                   # App entry + lifespan
│   ├── config.py                 # Settings (Pydantic)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example              # ← Backend env template (no secrets)
│   ├── api/v1/                   # REST + WebSocket routes
│   ├── agents/                   # Investigation chat agent
│   ├── core/                     # Security, dependencies, exceptions
│   ├── db/models/                # SQLAlchemy models
│   ├── repositories/             # Data access layer
│   ├── schemas/                  # Pydantic request/response schemas
│   ├── services/                 # Pipeline, LLM, reports, Detectra bridge
│   ├── workers/                  # Background analysis worker
│   ├── middleware/               # Rate limit, request ID
│   ├── alembic/                  # DB migrations
│   └── tests/                    # pytest suite (84 tests)
│
├── frontend/                     # Next.js application
│   ├── src/app/                  # App Router pages
│   │   ├── (marketing)/          # Public landing page
│   │   ├── (dashboard)/          # Authenticated app
│   │   └── auth/                 # Login, register, OAuth callback
│   ├── src/components/           # UI components
│   ├── src/lib/                  # API client, auth, Supabase
│   ├── src/hooks/                # Analysis progress, animations
│   ├── Dockerfile
│   └── .env.local.example        # ← Frontend env template (no secrets)
│
├── deployment/nginx/             # Production reverse proxy config
├── scripts/                      # Dev launcher, E2E tests, video tests
├── docker-compose.yml            # Full stack orchestration
├── .env.example                  # ← Root env template (no secrets)
└── docs/
    └── FINAL_REPORT.md           # Full academic project report
```

---

## 5. Setup Instructions (Windows + VS Code)

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.12+ |
| Node.js | 20+ |
| PostgreSQL | 15+ (or use Docker) |
| Redis | 7+ (optional) |
| ffmpeg | Latest |
| VS Code | Latest |
| Git | Latest |

### Step 1 — Clone & configure environment

```powershell
git clone <your-repo-url>
cd insightx-ai

# Copy templates — NEVER commit real keys
copy .env.example .env
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
```

Edit `.env` files with your values. See [Environment Variables](#6-environment-variables) below.

### Step 2 — VS Code extensions (recommended)

- Python
- Pylance
- ESLint
- Tailwind CSS IntelliSense
- REST Client (optional, for API testing)

### Step 3 — Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Run migrations (PostgreSQL must be running)
alembic upgrade head

# Start API
python -m uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/api/docs

### Step 4 — Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

### Step 5 — Detectra engine (optional, full accuracy)

Set in `.env`:

```env
DETECTRA_ENGINE_PATH=F:\path\to\detectra-ai\backend
```

If unset, the built-in YOLO + Whisper pipeline runs automatically.

### One-command Windows start

```powershell
.\scripts\dev.ps1
```

---

## 6. Environment Variables

> **Important:** Use `.env.example` files only as templates. **Do not submit real API keys** in Git or reports. Set secrets in local `.env` / hosting dashboards.

### Root `.env.example`

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key (256-bit random) |
| `DATABASE_URL` | PostgreSQL async URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWT_SECRET` | Validates Supabase tokens on backend |
| `SUPABASE_SERVICE_KEY` | Supabase admin key (storage) |
| `GROQ_API_KEY` | Primary LLM provider |
| `GEMINI_API_KEY` | LLM fallback |
| `HUGGINGFACE_API_KEY` | Open-source model fallback |
| `ANTHROPIC_API_KEY` | Premium LLM fallback |
| `ALLOWED_ORIGINS` | CORS (include Vercel URL in production) |
| `DETECTRA_ENGINE_PATH` | Path to Detectra backend |
| `STORAGE_BACKEND` | `local` \| `supabase` \| `s3` |

### Frontend `.env.local.example`

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `NEXT_PUBLIC_APP_URL` | Frontend URL |

Generate a secure `SECRET_KEY`:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 7. Commands Reference

### Run the application

| Task | Command |
|------|---------|
| **Backend (dev)** | `cd backend && python -m uvicorn main:app --reload --port 8000` |
| **Frontend (dev)** | `cd frontend && npm run dev` |
| **Both (Windows)** | `.\scripts\dev.ps1` |
| **Full stack (Docker)** | `docker compose up -d --build` |
| **DB migrations** | `cd backend && alembic upgrade head` |

### Data ingestion (video evidence)

Video evidence is ingested via the **Evidence Upload API** or dashboard UI:

```powershell
# Via dashboard: Investigations → Open case → Upload Evidence
# API (multipart form):
# POST /api/v1/evidence/upload
#   - file: video.mp4
#   - investigation_id: <uuid>
#   - auto_analyze: true
```

Batch pipeline test (local videos):

```powershell
cd insightx-ai
python scripts/test_all_videos.py
```

Place test videos in `test videos/` folder (MP4, AVI, MOV, MKV, WebM).

### Vector indexing / RAG

InsightX uses **structured analysis JSON** (not a separate vector DB) as retrieval context for the chat agent:

- Analysis results stored in PostgreSQL (`analysis_results` table)
- Chat agent builds context from incident scores, anomalies, timeline, transcription
- Detectra outputs optional `*_rag.json` files during offline analysis

For production RAG extension, connect results to Pinecone/Weaviate/Supabase pgvector (future enhancement).

### Evaluation

```powershell
# Backend unit tests (84 tests)
cd backend
pytest -q

# With coverage
pytest --cov=. --cov-report=term-missing

# Frontend type check + build
cd frontend
npm run type-check
npm run build

# Live API smoke test (backend must be running)
cd insightx-ai
python scripts/e2e_api_test.py
```

### Deployment

| Component | Platform | Command / Action |
|-----------|----------|------------------|
| **Frontend** | Vercel | Connect GitHub repo, set root to `frontend/`, add env vars |
| **Backend** | Oracle Cloud / Fly.io | Deploy `backend/Dockerfile`, set env vars |
| **Database** | Supabase / Neon | PostgreSQL connection string → `DATABASE_URL` |
| **Storage** | Supabase Storage | `STORAGE_BACKEND=supabase` |
| **Docker (full stack)** | Any VPS | `docker compose up -d` |

**Vercel + backend CORS example:**

```env
# Backend
ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app

# Vercel
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## 8. Expected Outputs & Screenshots

After successful setup, you should see:

| Step | Expected Output |
|------|-----------------|
| Backend health | `GET /health` → `{"status":"healthy","version":"1.0.0"}` |
| Frontend | Landing page at http://localhost:3000 |
| Register/Login | Redirect to `/dashboard` Mission Control |
| Create investigation | New case with auto-generated case number |
| Upload video | Progress bar → Live Analysis panel (0–100%) |
| Analysis complete | Incident score, person/vehicle counts, risk badge |
| Chat | AI response with provider label (e.g. "via Groq Llama 3.3") |
| Reports | PDF download with executive brief + timeline |
| pytest | `84 passed` |

**Screenshot checklist for submission:**

1. Landing page (hero + features)  
2. Dashboard Mission Control  
3. Investigation detail with live analysis progress  
4. Analysis results (scores + anomalies)  
5. AI Chat Investigator response  
6. PDF report preview  
7. API docs at `/api/docs`  
8. pytest terminal output  

> Place screenshots in `docs/screenshots/` when capturing for your report.

---

## 9. Known Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Frontend 500 / ENOSPC | Disk full; Next.js cache corrupt | Delete `frontend/.next`, free disk space, restart dev server |
| Login fails with Supabase | Email not verified or wrong provider | Verify email in Supabase; use FastAPI fallback for local accounts |
| Analysis stuck at 25% | Long Detectra run (normal) | Wait; progress ticker runs during blocking analyze() |
| WebSocket disconnects | Token expired or server reload | Re-login; HTTP polling fallback every 2.5s |
| Detectra not loading | Wrong `DETECTRA_ENGINE_PATH` | Point to folder containing `analyze_videos.py` |
| PDF fails on Windows | WeasyPrint GTK missing | ReportLab path used automatically as fallback |
| CORS error from Vercel | Backend missing Vercel origin | Add Vercel URL to `ALLOWED_ORIGINS` |
| HuggingFace VLM warnings | Router 400 / network | Non-fatal; core Detectra analysis still completes |
| Low disk during model download | Whisper ~1.5 GB | Free 3+ GB on drive or pre-download models |

**Logs:**

```powershell
# Backend runs with uvicorn stdout
# Check frontend terminal for Next.js errors
# Test videos report: backend/test_videos_report.json
```

---

## 10. API Quick Reference

Full docs: http://localhost:8000/api/docs

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Create account |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Current user |
| `GET` | `/api/v1/investigations` | List cases |
| `POST` | `/api/v1/evidence/upload` | Upload + analyze video |
| `GET` | `/api/v1/analysis/jobs/{id}/progress` | Job progress |
| `WS` | `/api/v1/analysis/ws/{id}?token=` | Live progress |
| `POST` | `/api/v1/chat` | AI investigator chat |
| `GET` | `/api/v1/reports/investigations/{id}/pdf` | PDF report |

---

## 11. Built By

| Name | Role |
|------|------|
| **Ahmad Yasin** | AI Engineer & Full-Stack Developer — detection engine, backend API, frontend architecture |
| **Abdul Rehman** | AI Engineer & Software Developer — multimodal fusion, anomaly pipeline, DevOps |

**University of Central Punjab** — Final Year Project

---

## 12. License

Built as a Final Year Project for AI & Computer Vision research at the University of Central Punjab. All rights reserved.

For the full academic report, see [`docs/FINAL_REPORT.md`](docs/FINAL_REPORT.md).

For **Vercel + backend production deployment**, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
