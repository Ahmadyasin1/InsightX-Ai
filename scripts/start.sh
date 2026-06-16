#!/bin/bash
# InsightX AI — Quick start script

set -e

echo "🚀 Starting InsightX AI..."

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "📋 Creating .env from template..."
  cp .env.example .env
  echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY before running."
fi

# Start services
echo "🐳 Starting Docker services..."
docker compose up -d --build

echo ""
echo "✅ InsightX AI is starting up!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/api/docs"
echo ""
echo "Waiting for services to be healthy..."
sleep 15

docker compose ps
