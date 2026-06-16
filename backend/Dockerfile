FROM python:3.12-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install PyTorch CPU first (separate to leverage Docker layer cache)
RUN pip install --no-cache-dir torch torchvision torchaudio \
    --index-url https://download.pytorch.org/whl/cpu

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directory
RUN mkdir -p /app/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
