# GlucoSense Infrastructure

This directory contains Docker Compose configuration for running GlucoSense services locally.

## Prerequisites

- Docker and Docker Compose installed
- Git

## Quick Start

1. **Create environment file**
   ```bash
   cd infra
   cp .env.example .env
   ```

2. **Configure credentials**
   Edit `.env` and set secure values:
   ```bash
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_secure_password_here
   POSTGRES_DB=glucosense
   ```

   **⚠️ IMPORTANT**: Never commit the `.env` file to version control!

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Check service health**
   ```bash
   docker-compose ps
   ```

## Services

- **PostgreSQL (TimescaleDB)**: Port 5432
- **Redis**: Port 6379
- **FastAPI Backend**: Port 8000
- **Celery Worker**: Background task processing

## Stopping Services

```bash
docker-compose down
```

To remove volumes (⚠️ this will delete all data):
```bash
docker-compose down -v
```

## Security Notes

- The `.env` file contains sensitive credentials and is excluded from version control
- Always use strong, unique passwords for production environments
- The `.env.example` file provides a template with placeholder values
- Never hardcode credentials in `docker-compose.yml`

## Troubleshooting

**Services won't start:**
```bash
docker-compose logs
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up -d
```

**Access PostgreSQL:**
```bash
docker exec -it glucosense-db psql -U <your_user> -d glucosense
```
