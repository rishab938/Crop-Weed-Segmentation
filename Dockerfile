# ── Stage 1: Build React Frontend ──
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:frontend

# ── Stage 2: Python Backend with U-Net ML & Built Frontend ──
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for OpenCV, GUI bindings, and imaging
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements (uses PyTorch CPU wheel)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and built frontend distribution
COPY backend/ ./backend/
COPY --from=frontend-builder /app/dist ./dist

# Create standard non-root user (UID 1000) required by Hugging Face Spaces
RUN useradd -m -u 1000 user && \
    mkdir -p /app/backend/uploads && \
    chown -R user:user /app
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app/backend

EXPOSE 7860

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
