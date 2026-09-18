# ==========================================
# Stage 1: Build React/Vite Frontend
# ==========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better Docker caching
COPY frontend/package*.json ./

# Install ALL dependencies, including devDependencies
RUN npm install --include=dev --no-audit --no-fund

# Copy frontend source
COPY frontend/ ./

# Make Vite executable and build
RUN chmod +x node_modules/.bin/vite && npm run build


# ==========================================
# Stage 2: Python Flask Backend
# ==========================================
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy compiled frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Render will provide PORT, but default to 5000
ENV HOST=0.0.0.0
ENV PORT=5000

EXPOSE 5000

WORKDIR /app/backend

CMD ["python", "app.py"]
