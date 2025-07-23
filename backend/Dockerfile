# Multi-stage build for faster cold boot on Cloud Run
FROM python:3.8-slim AS builder

# Install system dependencies and build tools
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install OpenJDK 17 (11 is not available in bookworm, 17 is LTS and works with STOUT)
RUN apt-get update && apt-get install -y default-jdk && rm -rf /var/lib/apt/lists/*
ENV JAVA_HOME=/usr/lib/jvm/default-java

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies (use pip instead of conda for smaller footprint)
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Create app user and STOUT model cache directory structure
RUN useradd --create-home --shell /bin/bash app && \
    mkdir -p /home/app/.data/STOUT-V2/models && \
    chown -R app:app /home/app/.data

# Switch to app user to download models to correct location
USER app
WORKDIR /home/app

# Pre-download STOUT models during build time for faster cold starts
RUN python -c "from STOUT import translate_forward; translate_forward('CCO')" && \
    echo "STOUT model pre-downloaded successfully" && \
    ls -la /home/app/.data/STOUT-V2/models && \
    echo "Model files downloaded:" && \
    find /home/app/.data -name "*.bin" -o -name "*.json" -o -name "*.txt" | head -10

# ==========================================
# Final stage - minimal runtime image
FROM python:3.8-slim

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    default-jre-headless \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/default-java
ENV PATH="/opt/venv/bin:$PATH"

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create app user in final stage
RUN useradd --create-home --shell /bin/bash app

# Copy pre-downloaded STOUT models from builder
COPY --from=builder /home/app/.data /home/app/.data
RUN chown -R app:app /home/app/.data

# Set working directory
WORKDIR /app

# Copy application code
COPY . /app
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 8000

# Health check for faster readiness detection
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Optimized startup command for Cloud Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "uvloop", "--http", "httptools"] 