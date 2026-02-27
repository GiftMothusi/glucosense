#!/usr/bin/env bash
set -e

echo "Starting GlucoSense Backend..."

# Ensure PostgreSQL and Redis are running
sudo systemctl start postgresql redis-server 2>/dev/null || true

# Run migrations
cd "$(dirname "$0")/backend"
./venv/bin/alembic upgrade head

# Start the API server
./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
