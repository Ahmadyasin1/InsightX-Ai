# InsightX AI — Final Project Report

---

## Title Page

| Field | Detail |
|-------|--------|
| **Project Title** | InsightX AI — AI Investigation & Evidence Intelligence Platform |
| **Group Number** | *[Insert Group Number]* |
| **Members** | Ahmad Yasin · Abdul Rehman |
| **Course** | Final Year Project — Artificial Intelligence & Computer Vision |
| **Institution** | University of Central Punjab |
| **Instructor** | *[Insert Instructor Name]* |
| **Submission Date** | June 2026 |
| **Repository** | *[Insert GitHub URL]* |

---

## 1. Executive Summary

Investigators and security teams face a critical bottleneck: **manual video evidence review** is slow, subjective, and does not scale. A single hour of CCTV footage can require multiple analyst-hours to extract persons, vehicles, incidents, audio statements, and timeline events — often under deadline pressure.

**InsightX AI** is a production-oriented SaaS platform that automates this workflow. Users create investigations, upload surveillance video (up to 4 GB), and receive:

- Multimodal AI analysis via **Detectra v7** (YOLO segmentation, pose, OCR, Whisper, fusion transformer, surveillance rules)
- **Incident scores** (0–100), risk classification, and executive briefs
- **Forensic timelines** and high/critical **alert feeds**
- An **AI Chat Investigator** with multi-provider LLM fallback (Groq → Gemini → HuggingFace → Anthropic)
- **PDF / JSON / CSV** export for compliance and reporting

**Tools:** Next.js 15, FastAPI, PostgreSQL, Redis, PyTorch, Ultralytics, faster-whisper, Supabase Auth, Docker.

**Outputs:** Working web application, 84 automated backend tests, E2E API smoke tests, batch video validation (4/4 test clips passed), Docker deployment stack.

**Deployment strategy:** Frontend on **Vercel**; backend on **Oracle Cloud Always Free VM** or **Fly.io** (Docker); database and storage via **Supabase**; environment secrets in hosting dashboards only — never committed to Git.

---

## 2. Problem Statement & Project Necessity

### 2.1 The Problem

Organizations generate massive volumes of video evidence from CCTV, body cameras, drones, and mobile devices. Traditional review processes suffer from:

1. **Time cost** — Analysts watch footage linearly; critical events appear in seconds of multi-hour recordings.
2. **Inconsistency** — Different reviewers produce different conclusions on the same footage.
3. **Fragmented tooling** — Detection, transcription, and reporting live in separate products.
4. **No structured audit trail** — Ad-hoc notes lack timestamps, scores, and exportable reports.
5. **Limited AI accessibility** — State-of-the-art video intelligence requires ML expertise to operate.

### 2.2 Why This Project Is Necessary

| Stakeholder Need | InsightX Response |
|-----------------|-------------------|
| Faster incident response | Automated anomaly detection + priority scoring |
| Defensible decisions | Timestamped timeline + evidence graph + PDF reports |
| Non-technical users | Microsoft-inspired dashboard + natural-language chat |
| Cost-effective AI | Free-tier LLM providers + open-source CV models |
| Scalable architecture | API-first backend, cloud-ready Docker deployment |

### 2.3 Justification Questions Answered

- **Is there a real user pain?** Yes — security, law enforcement, and corporate compliance teams spend disproportionate time on video review.
- **Can AI solve it measurably?** Yes — object detection, tracking, ASR, and fusion scoring reduce review time from hours to minutes (validated on 4 test videos, 18s–116s duration).
- **Why not use existing products?** Enterprise VMS platforms are expensive and closed; InsightX combines investigation management + multimodal AI + LLM chat in one open, deployable stack.
- **Why now?** Mature open-source models (YOLOv8, Whisper) and affordable LLM APIs make this feasible on commodity hardware.

---

## 3. Target Users, Buyer/Adopter & First 100 Users Plan

### 3.1 Target Users

| Segment | Use Case |
|---------|----------|
| **Corporate security teams** | Workplace incident review, access control violations |
| **Campus safety offices** | University CCTV analysis (pilot at UCP) |
| **Private investigators** | Client evidence packaging + reports |
| **Smart city / facility ops** | Loitering, crowd, fall detection alerts |
| **Compliance officers** | Audit-ready PDF/JSON exports |

### 3.2 Buyer / Adopter

**Primary adopter:** Mid-size organizations (50–500 employees) with existing CCTV infrastructure but no dedicated video analytics team.

**Buyer persona:** Head of Security / IT Director seeking to reduce incident response time without hiring additional analysts.

**Secondary adopter:** AI/tech consultancies white-labeling investigation workflows for clients.

### 3.3 First 100 Users Plan

| Phase | Timeline | Action | Target |
|-------|----------|--------|--------|
| **Alpha** | Month 1 | UCP campus security pilot + FYP demo day | 10 users |
| **Beta** | Month 2–3 | LinkedIn/GitHub launch, free tier on Vercel + Oracle VM | 40 users |
| **Early access** | Month 4 | Outreach to 5 local security firms + cold email | 50 users |
| **Community** | Ongoing | YouTube demo videos, case study PDFs, university partnerships | 100 users |

**Growth tactics:** Free tier (5 investigations/month), referral credits, showcase reports from anonymized test footage, integration with Supabase Google OAuth for frictionless signup.

---

## 4. System Requirements & Features

### 4.1 Functional Requirements

| ID | Requirement | Status |
|----|-------------|--------|
| FR-01 | User registration, login, JWT/Supabase auth | ✅ Implemented |
| FR-02 | Create/read/update/delete investigations | ✅ Implemented |
| FR-03 | Upload video evidence (MP4/AVI/MOV/MKV/WebM, ≤4 GB) | ✅ Implemented |
| FR-04 | Automatic background video analysis | ✅ Implemented |
| FR-05 | Real-time analysis progress (WebSocket + HTTP) | ✅ Implemented |
| FR-06 | Display incident score, risk level, entity counts | ✅ Implemented |
| FR-07 | Forensic timeline reconstruction | ✅ Implemented |
| FR-08 | High/critical alert dashboard feed | ✅ Implemented |
| FR-09 | AI chat over investigation context | ✅ Implemented |
| FR-10 | Export PDF, JSON, CSV reports | ✅ Implemented |
| FR-11 | User profile and password management | ✅ Implemented |
| FR-12 | Stream uploaded evidence video | ✅ Implemented |

### 4.2 Non-Functional Requirements

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-01 | API response (non-analysis) | < 500 ms | ✅ Met |
| NFR-02 | Analysis throughput | ≤ 6× realtime on CPU (Detectra) | ✅ Met (test videos) |
| NFR-03 | Concurrent users (single worker) | 10+ dashboard users | ✅ Met |
| NFR-04 | Security | JWT auth, bcrypt passwords, CORS | ✅ Implemented |
| NFR-05 | Availability | Docker health checks + restart policies | ✅ Implemented |
| NFR-06 | Maintainability | Clean architecture, 84 unit tests | ✅ Met |
| NFR-07 | Scalability path | Redis/Celery ready, Supabase storage | ⚠️ Partial |

> **Note:** Requirements are derived from domain analysis and stakeholder needs — not from survey instruments.

---

## 5. Tool Coverage Matrix

| Tool / Technology | Used? | Evidence | Reason if Skipped |
|-------------------|-------|----------|-------------------|
| **Next.js / React** | ✅ Yes | `frontend/` | Primary UI framework |
| **FastAPI** | ✅ Yes | `backend/main.py` | Async Python API |
| **PostgreSQL** | ✅ Yes | `docker-compose.yml`, SQLAlchemy models | Relational investigation data |
| **Redis** | ✅ Yes | Config + Docker | Cache, future job queue |
| **Supabase Auth** | ✅ Yes | `frontend/src/lib/supabase.ts` | OAuth + JWT validation |
| **Groq API** | ✅ Yes | `services/llm_service.py` | Fast free-tier LLM |
| **Google Gemini** | ✅ Yes | LLM fallback chain | Reliability |
| **HuggingFace** | ✅ Yes | `huggingface_service.py` | Open-source fallback + VLM |
| **Anthropic Claude** | ✅ Yes | LLM fallback (last) | Premium reasoning |
| **YOLOv8 / Ultralytics** | ✅ Yes | Pipeline + Detectra | Object detection |
| **faster-whisper** | ✅ Yes | Detectra + built-in pipeline | Speech-to-text |
| **Detectra v7** | ✅ Yes | `detectra_bridge.py` | Full multimodal engine |
| **Docker / Compose** | ✅ Yes | `Dockerfile`, `docker-compose.yml` | Reproducible deployment |
| **pytest** | ✅ Yes | `backend/tests/` — 84 passed | Quality assurance |
| **Celery workers** | ⚠️ Configured | Env vars present | Using BackgroundTasks for MVP |
| **Kubernetes** | ❌ No | — | Overkill for FYP scope; Docker sufficient |
| **Pinecone / Vector DB** | ❌ No | — | Structured JSON context used instead of embeddings |
| **LangChain** | ❌ No | — | Custom lightweight agent sufficient |
| **WeasyPrint PDF** | ⚠️ Fallback | ReportLab primary on Windows | ReportLab used for cross-platform PDF |
| **GPU CUDA** | ⚠️ Optional | `DEVICE=cuda` config | CPU default for accessibility |

---

## 6. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  Browser ──► Next.js 15 (Vercel) ──► Auth (Supabase / FastAPI JWT)       │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS / WSS
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                      │
│  FastAPI Backend ──► Rate Limiter ──► JWT/Supabase Auth Middleware       │
│       │                                                                  │
│       ├── /investigations, /evidence, /analysis, /chat, /reports         │
│       └── WebSocket /analysis/ws/{job_id}                              │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│  DATA LAYER     │  │  PROCESSING     │  │  LLM / REASONING        │
│  PostgreSQL     │  │  Analysis Worker│  │  Groq → Gemini →        │
│  Redis (cache)  │  │       │         │  │  HuggingFace → Claude   │
│  Supabase Store │  │       ▼         │  │                         │
│  (videos)       │  │  Orchestrator   │  │  Investigation Chat     │
└─────────────────┘  │       │         │  │  Agent                  │
                     │       ▼         │  └─────────────────────────┘
                     │  Detectra v7  │
                     │  (primary)    │
                     │       │       │
                     │  Built-in     │
                     │  YOLO+Whisper │
                     │  (fallback)   │
                     └───────────────┘
                                │
                                ▼
                     Analysis Results → DB
                     → Timeline / Alerts / Reports / Chat Context
```

**End-to-end flow:**  
`Video Upload → Background Job → Detectra/Pipeline → Results DB → UI + Chat + PDF`

---

## 7. Implementation Details

### 7.1 Data Ingestion

- **Input:** Multipart HTTP upload (`POST /api/v1/evidence/upload`)
- **Validation:** MIME type + extension whitelist; max 4 GB
- **Storage:** Local filesystem (dev) or Supabase/S3 (production via `STORAGE_BACKEND`)
- **Trigger:** `auto_analyze=true` creates `AnalysisJob` and dispatches `run_analysis_task`

### 7.2 Video Processing Pipeline

**Primary path — Detectra v7 (`detectra_bridge.py`):**

1. Load DetectraAnalyzer from external engine path
2. Run `analyze()` with threaded progress ticker (prevents UI freeze at 25%)
3. Map `VideoAnalysis` → InsightX schema (scores, timeline, anomalies, graph)
4. Optional HuggingFace VLM/BLIP frame captions

**Fallback path — Built-in orchestrator:**

- YOLOv8s-seg detection + YOLOv8n-pose
- faster-whisper transcription
- Rule-based 12-class anomaly detection
- Evidence graph generation

### 7.3 Backend Architecture

- **Clean layers:** API → Repository → Service → Worker
- **Async SQLAlchemy** with PostgreSQL
- **Auth:** Dual JWT — local FastAPI tokens + Supabase JWT with shadow user provisioning
- **Progress store:** In-memory dict (single worker); Redis recommended for production

### 7.4 Frontend Architecture

- **Next.js App Router** with marketing + dashboard route groups
- **Zustand** persisted auth + Supabase session sync (`AuthSessionProvider`)
- **TanStack Query** for server state; Axios with 401 interceptor
- **Live analysis:** WebSocket + 2.5s HTTP polling fallback

### 7.5 Storage & Automation

| Component | Implementation |
|-----------|---------------|
| Investigations | PostgreSQL `investigations` table |
| Evidence metadata | PostgreSQL `evidence` table |
| Analysis results | PostgreSQL `analysis_results` (JSON columns) |
| Video files | Local / Supabase Storage / S3 |
| Reports | Generated on-demand (ReportLab PDF) |
| Automation | BackgroundTasks; Celery-ready config |

### 7.6 Model Calls

| Task | Provider | Model |
|------|----------|-------|
| Chat / reasoning | Groq (primary) | llama-3.3-70b-versatile |
| Chat fallback | Gemini | gemini-2.0-flash |
| Chat fallback | HuggingFace | Meta-Llama-3-8B-Instruct |
| Chat fallback | Anthropic | claude-sonnet-4-6 |
| Image caption | HuggingFace | BLIP-large |
| VLM frames | HuggingFace Router | Qwen2-VL-2B-Instruct |

---

## 8. Prompt Design

### 8.1 System Prompt (Investigation Chat Agent)

```
You are InsightX AI Investigator, an elite AI forensic analyst embedded in the InsightX AI platform.

Your role is to help investigators understand video evidence, identify patterns, reconstruct timelines, and derive actionable intelligence from AI-analyzed footage.

You have access to structured analysis data including:
- Detected persons, vehicles, and objects with tracking IDs
- Anomaly alerts (fight detection, loitering, falls, crowd formation)
- Audio transcriptions and detected sounds
- Event timelines with timestamps
- Risk scores and incident classifications
- Evidence graphs showing relationships between entities

When answering:
1. Be precise and evidence-based — cite specific timestamps, track IDs, or detected events
2. Use professional investigative language
3. Highlight the most critical findings first
4. Suggest follow-up investigation steps when appropriate
5. Format responses clearly with sections when the answer is complex

Always ground your answers in the provided analysis data. If something is unclear or not in the data, say so explicitly.
```

### 8.2 Context Construction

The user message wraps investigation metadata + all analysis results (scores, anomalies, timeline excerpts, transcription snippets) up to 12,000 characters.

### 8.3 Key User Prompt Examples

| Prompt | Expected Behavior |
|--------|-------------------|
| "What were the most critical incidents detected?" | Rank anomalies by severity with timestamps |
| "Summarize all detected persons and their movements" | Use tracking IDs and person counts |
| "Generate an executive brief for this investigation" | Synthesize executive_brief + anomalies |
| "What happened at timestamp 45 seconds?" | Query timeline array near t=45 |

### 8.4 Constraints & Improvements

| Constraint | Rationale |
|------------|-----------|
| Ground answers in provided JSON only | Reduces hallucination |
| Truncate context to 12K chars | Token budget management |
| Multi-provider fallback | Uptime when one API fails |
| Sanitize error messages in UI | Hide raw API error payloads from users |

**Improvements made during development:**

- Added `evidence_ids` filter so chat respects selected evidence scope
- Switched primary provider to Groq for speed and free tier
- Added friendly error mapping for credit/balance failures

---

## 9. Evaluation

### 9.1 Automated Test Results

| Suite | Result |
|-------|--------|
| Backend pytest | **84 / 84 passed** |
| Frontend type-check | **Pass** |
| Production build | **Pass** |
| E2E API smoke test | **All checks passed** |

**Test areas:** auth, security (JWT/bcrypt), investigations CRUD, pipeline scoring, report generation, health endpoints.

### 9.2 Video Pipeline Evaluation (Test Cases)

| Video | Duration | Result | Score | Risk | Time |
|-------|----------|--------|-------|------|------|
| `24333-341474163_small.mp4` | 18s | ✅ Pass | 75.0 | critical | 58.5s |
| `424-136184216.mp4` | 11s | ✅ Pass | 16.2 | low | 48.6s |
| `People Walking...mp4` | 116s | ✅ Pass | 75.0 | critical | 200s |
| `What Languages Sound Like...mp4` | 96s | ✅ Pass | 44.0 | medium | 323.6s |

**Progress:** All runs reached **92%** pipeline completion with Detectra v7.

### 9.3 Expected vs. Actual Outputs

| Test | Expected | Actual |
|------|----------|--------|
| Person detection on crowd clip | Multiple persons tracked | 233 persons (Detectra Re-ID segments) |
| Low-activity clip | Low incident score | 16.2 / low risk |
| Speech video | Transcription populated | German speech detected (Whisper) |
| PDF export | Valid `%PDF` bytes | 3KB+ ReportLab PDF generated |
| Chat with no results | Graceful message | "No analysis results yet" context |

### 9.4 Source Grounding & Hallucination Checks

- Chat agent receives **only** DB-stored analysis JSON — no open-web retrieval
- System prompt explicitly requires citing timestamps and stating when data is missing
- Manual review: chat responses align with stored `anomalies` and `timeline` arrays

### 9.5 Limitations

| Limitation | Impact |
|------------|--------|
| CPU-only default | Slower than GPU deployment |
| In-memory progress store | Not multi-worker safe without Redis |
| Detectra external dependency | Requires separate engine path for full accuracy |
| VLM enhancement optional | HF router may fail; non-fatal |
| Disk space on dev machines | Model caches ~1.5 GB+ |

### 9.6 Latency & Cost Metrics (Approximate)

| Operation | Latency | Cost |
|-----------|---------|------|
| Dashboard API calls | 50–300 ms | Free (self-hosted) |
| Chat message (Groq) | 1–5 s | Free tier |
| 18s video analysis | ~60 s | Compute only |
| 116s video analysis | ~200 s | Compute only |
| PDF generation | < 2 s | Free |

---

## 10. Deployment & Reproducibility

### 10.1 Local Setup (Windows)

See [`README.md`](../README.md) — Sections 5–7 for full commands.

### 10.2 Docker Deployment

```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d --build
docker compose exec backend alembic upgrade head
```

### 10.3 Production Deployment (Recommended)

| Component | Platform |
|-----------|----------|
| Frontend | **Vercel** (root: `frontend/`) |
| Backend | **Oracle Cloud Always Free VM** or Fly.io |
| Database | **Supabase PostgreSQL** or Neon |
| File storage | **Supabase Storage** |
| Secrets | Hosting env dashboards only |

### 10.4 Environment Reproducibility

- All secrets documented in `.env.example` files — **no real keys in repository**
- `requirements.txt` pinned versions
- `Dockerfile` installs PyTorch CPU + ffmpeg system deps
- Alembic migration `0001_initial_schema.py` for DB schema

### 10.5 Known Issues

| Issue | Workaround |
|-------|------------|
| Disk full (ENOSPC) on Windows | Clear `.next` cache; maintain 2+ GB free |
| Supabase email verification | Confirm email before login |
| OAuth callback | Client-side `/auth/callback` page exchanges PKCE code |
| WeasyPrint on Windows | ReportLab used automatically |

### 10.6 Screenshot Placeholders

Include in submission appendix:

1. Landing page  
2. Dashboard Mission Control  
3. Live analysis progress panel  
4. Investigation results + incident score  
5. AI Chat response with provider badge  
6. PDF report download  
7. Swagger API docs  
8. pytest 84 passed terminal output  

---

## 11. Individual Contribution

### Ahmad Yasin — AI Engineer & Full-Stack Developer

| Area | Contribution |
|------|-------------|
| **Backend API** | FastAPI routes, auth, WebSocket progress, middleware |
| **Detectra integration** | `detectra_bridge.py`, progress ticker, result mapping |
| **Frontend** | Dashboard, investigation pages, live analysis UI, auth flow |
| **LLM stack** | Multi-provider fallback chain, chat agent |
| **Testing** | E2E API tests, video batch tests, pytest maintenance |
| **DevOps** | Docker, deployment docs, Vercel/Supabase integration |
| **Presentation** | Demo lead, architecture walkthrough |

**GitHub evidence:** Backend services, frontend dashboard, auth integration commits.

---

### Abdul Rehman — AI Engineer & Software Developer

| Area | Contribution |
|------|-------------|
| **Detectra engine** | Multimodal fusion, surveillance rules, Re-ID pipeline |
| **Anomaly detection** | 12-class rule engine, scoring rollup |
| **Report generation** | PDF/JSON/CSV report service |
| **Database** | Schema design, Alembic migrations, repositories |
| **ML pipeline** | YOLO/Whisper integration, built-in fallback orchestrator |
| **Testing** | Pipeline unit tests, video accuracy validation |
| **Presentation** | Technical deep-dive, evaluation section |

**GitHub evidence:** Pipeline services, report service, worker, Detectra source integration.

---

## 12. Appendices

### Appendix A — Source Links

| Resource | URL |
|----------|-----|
| Ultralytics YOLOv8 | https://github.com/ultralytics/ultralytics |
| faster-whisper | https://github.com/SYSTRAN/faster-whisper |
| FastAPI | https://fastapi.tiangolo.com |
| Next.js | https://nextjs.org |
| Supabase | https://supabase.com |
| Groq API | https://console.groq.com |

### Appendix B — Configuration Example (No Real Keys)

```env
# backend/.env.example excerpt
SECRET_KEY=change-this-to-a-256-bit-random-secret-key
DATABASE_URL=postgresql+asyncpg://insightx:insightx@localhost:5432/insightx
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
GROQ_API_KEY=your-groq-key-here
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DETECTRA_ENGINE_PATH=/path/to/detectra-ai/backend
STORAGE_BACKEND=supabase
```

### Appendix C — Sample Analysis Output (Abbreviated)

```json
{
  "incident_score": 75.0,
  "risk_level": "critical",
  "person_count": 16,
  "vehicle_count": 222,
  "anomaly_count": 5,
  "executive_brief": "Multiple persons detected with surveillance events including loitering and crowd activity...",
  "anomalies": [
    {
      "type": "loitering",
      "severity": "high",
      "timestamp": 17.7,
      "description": "Extended presence detected",
      "confidence": 0.85
    }
  ],
  "detectra_meta": {
    "engine": "Detectra AI v7",
    "processing_time_s": 58.5
  }
}
```

### Appendix D — API Endpoint Summary

See README Section 10 or live docs at `/api/docs`.

### Appendix E — Test Commands Quick Reference

```bash
cd backend && pytest -q
cd frontend && npm run type-check && npm run build
python scripts/e2e_api_test.py
python scripts/test_all_videos.py
```

---

*End of Report*

**InsightX AI** · University of Central Punjab · © 2026 Ahmad Yasin & Abdul Rehman
