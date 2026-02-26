# 🩸 GlucoSense — Intelligent Diabetes Management App

A production-grade, full-stack diabetes management application built with React Native (Expo) and Python (FastAPI).

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo bare workflow) + TypeScript |
| State | Zustand + React Query |
| Charts | React Native SVG + Victory Native |
| Backend | FastAPI (async) + Python 3.12 |
| Database | PostgreSQL + TimescaleDB |
| Analytics | Pandas, NumPy, Scikit-learn, Prophet |
| Cache / Queue | Redis + Celery |
| Auth | JWT (access + refresh token) |
| Infra | Docker Compose (dev) → Railway (prod) |

---

## Local Development Setup

### Prerequisites
- Python 3.13 (works with 3.12+)
- Node.js 20+
- Docker + Docker Compose
- Expo Go app on your phone

### 1. Start Infrastructure (Database + Redis)

```bash
cd infra
cp .env.example .env
# Edit .env with PostgreSQL password (default: postgres123)

docker compose up postgres redis -d
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env - update DATABASE_URL to match infra/.env password

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

#check laptop ip address on mac
ipconfig getifaddr en0

# Install core packages first
pip install fastapi uvicorn sqlalchemy alembic asyncpg psycopg2-binary pydantic python-jose passlib bcrypt python-multipart celery redis boto3 sentry-sdk slowapi email-validator pytz aiofiles websockets pytest pytest-asyncio faker python-dotenv httpx

# Install data science packages (Python 3.13 compatible versions)
pip install --only-binary=:all: pandas scipy scikit-learn prophet reportlab pillow numpy

# Handle database migrations
alembic stamp head  # Skip problematic migration for now
# alembic upgrade head  # Use this when migrations are fixed

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 3. Mobile App Setup

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

**Mobile Connection Issues?**
- If QR code doesn't work: In Expo Go app, tap "Enter URL manually" and type the LAN URL shown in terminal
- Make sure phone and laptop are on same WiFi
- Try `npx expo start --tunnel` if LAN doesn't work (requires ngrok installation)
- For testing: `npx expo start --web` opens in browser

### Troubleshooting Common Issues

**Python package installation fails:**
- Use `pip install --only-binary=:all: <package>` for precompiled wheels
- Python 3.13 may have compilation issues with some packages

**Migration errors:**
- Use `alembic stamp head` to mark database as current
- Or reset database: `docker compose down postgres && docker volume rm infra_postgres_data && docker compose up postgres -d`

**Mobile connection issues:**
- Check phone/laptop are on same WiFi
- Use manual URL entry in Expo Go
- Try tunnel mode: `npx expo start --tunnel`

---

### Full Docker setup (API + DB + Redis together)

```bash
cd infra
docker-compose up --build
```

---

## Project Structure

```
glucosense/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/routes/         # All API endpoints
│   │   ├── analytics/          # ML/stats engine
│   │   │   ├── glucose/        # TIR, patterns, predictions
│   │   │   ├── nutrition/      # Meal impact scoring
│   │   │   └── correlations/   # Cross-variable analysis
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── workers/            # Celery background tasks
│   │   └── core/               # Config, DB, security
│   ├── migrations/             # Alembic migrations
│   └── tests/
│
├── mobile/                     # React Native (Expo) app
│   └── src/
│       ├── screens/            # All app screens
│       ├── components/         # Reusable UI + charts
│       ├── store/              # Zustand state stores
│       ├── services/           # API client (axios)
│       ├── navigation/         # React Navigation setup
│       └── theme/              # Design system (colors, type, spacing)
│
└── infra/                      # Docker Compose configs
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Current user |

### Glucose
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/glucose/` | Log reading |
| GET | `/api/v1/glucose/` | List readings |
| GET | `/api/v1/glucose/latest` | Latest reading |
| GET | `/api/v1/glucose/stats` | Statistics (TIR, avg, HbA1c) |
| GET | `/api/v1/glucose/patterns` | 🔒 Pattern detection |
| GET | `/api/v1/glucose/hourly-profile` | 🔒 24h profile |
| GET | `/api/v1/glucose/daily-averages` | Daily averages |

### Insulin
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/insulin/` | Log dose |
| GET | `/api/v1/insulin/` | List doses |
| POST | `/api/v1/insulin/bolus-calculator` | Smart bolus calc |

### Meals, Activities, Care
Similar CRUD patterns — see `/docs` for full spec.

🔒 = Premium only

---

## Freemium Model

| Feature | Free | Premium ($7.99/mo) |
|---|---|---|
| Glucose logging | ✅ | ✅ |
| Meal + insulin logging | ✅ | ✅ |
| 30-day history | ✅ | ✅ |
| Unlimited history | ❌ | ✅ |
| AI pattern detection | ❌ | ✅ |
| Predictive alerts | ❌ | ✅ |
| Meal impact scoring | ❌ | ✅ |
| Doctor PDF reports | ❌ | ✅ |
| Care portal sharing | ❌ | ✅ |
| CGM Bluetooth sync | ❌ | ✅ |

---

## Environment Variables

See `backend/.env.example` for the full list.

Key variables:
- `SECRET_KEY` — change this before any production deploy
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `SENTRY_DSN` — error tracking (optional)

---

## Next Steps (Roadmap)

See `docs/TASKS.md` for the complete task list from the scaffold.
