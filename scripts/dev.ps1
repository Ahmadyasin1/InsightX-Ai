# InsightX AI — Windows Development Start Script
param()

Write-Host "Starting InsightX AI development environment..." -ForegroundColor Cyan

# Check for .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from template. Edit ANTHROPIC_API_KEY before running." -ForegroundColor Yellow
}

# Start backend in background
Write-Host "Starting backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PWD\backend'
if (-not (Test-Path 'venv')) { python -m venv venv }
.\venv\Scripts\activate
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"@ -WindowStyle Normal

Start-Sleep 3

# Start frontend in background
Write-Host "Starting frontend (Next.js)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", @"
cd '$PWD\frontend'
npm install
npm run dev
"@ -WindowStyle Normal

Write-Host ""
Write-Host "InsightX AI development servers starting:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/api/docs" -ForegroundColor White
