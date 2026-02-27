# 🩸 GlucoSense — Intelligent Diabetes Management App

A production-grade, full-stack diabetes management application built with React Native (Expo) and Python (FastAPI).

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo) + TypeScript |
| State | Zustand + React Query |
| Charts | React Native SVG + Victory Native |
| Backend | FastAPI (async) + Python 3.13 |
| Database | PostgreSQL 17 (local) |
| Analytics | Pandas, NumPy, Scikit-learn, Prophet |
| Cache / Queue | Redis + Celery |
| Auth | JWT (access + refresh token) |

---

## Local Development Setup

### Prerequisites
- Python 3.13
- Node.js 20+
- PostgreSQL 17 (`sudo apt install postgresql`)
- Redis (`sudo apt install redis-server`)
- Expo Go app on your phone

### Quick Start

```bash
# Terminal 1 — Backend (runs migrations + starts API)
./start-backend.sh

# Terminal 2 — Mobile
./start-mobile.sh
```

### Manual Setup (first time)

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit if needed
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Mobile:**
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --clear
```

API docs: `http://localhost:8000/docs`

### Mobile Backend URL

Edit `mobile/src/services/api.ts` and set `BASE_URL` to your laptop's LAN IP:
```ts
const BASE_URL = __DEV__
  ? 'http://<YOUR_LAPTOP_IP>:8000/api/v1'
  : 'https://api.glucosense.health/api/v1';
```

Find your IP with: `hostname -I | awk '{print $1}'`

### Troubleshooting

**Migration errors:**
```bash
# Full reset (drops all tables and re-runs)
sudo -u postgres psql -p 5433 -d glucosense -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
cd backend && ./venv/bin/alembic upgrade head
```

**Mobile connection issues:**
- Make sure phone and laptop are on the same WiFi
- Use manual URL entry in Expo Go if QR doesn't work
- Try `npx expo start --tunnel` as a fallback

---

## Project Structure

```
glucosense/
├── start-backend.sh            # Start backend (one command)
├── start-mobile.sh             # Start mobile (one command)
│
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   ├── api/routes/         # All API endpoints
│   │   ├── analytics/          # ML/stats engine
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── workers/            # Celery background tasks
│   │   └── core/               # Config, DB, security
│   ├── migrations/             # Alembic migrations
│   └── tests/
│
└── mobile/                     # React Native (Expo) app
    └── src/
        ├── screens/            # All app screens
        ├── components/         # Reusable UI + charts
        ├── store/              # Zustand state stores
        ├── services/           # API client (axios)
        ├── navigation/         # React Navigation setup
        └── theme/              # Design system
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
