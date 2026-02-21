# GlucoSense — Scaffold Task List

This document tracks what has been built in the scaffold and what remains.
Use this at the start of every new chat to orient Claude.

---

## ✅ COMPLETED IN THIS SCAFFOLD

### Backend (FastAPI + Python)

#### Infrastructure
- [x] Project directory structure (`backend/app/{api,models,schemas,services,analytics,workers,core}`)
- [x] `requirements.txt` — all dependencies pinned
- [x] `Dockerfile` — production-ready, non-root user
- [x] `.env.example` — all environment variables documented
- [x] `alembic.ini` + `migrations/env.py` — async migration setup
- [x] `docker-compose.yml` — Postgres (TimescaleDB), Redis, API, Celery worker

#### Core
- [x] `core/config.py` — Pydantic Settings with all config
- [x] `core/database.py` — Async SQLAlchemy engine, session factory, `init_db`
- [x] `core/security.py` — JWT access + refresh tokens, bcrypt, `get_current_user`, `get_current_premium_user`

#### Models (SQLAlchemy ORM)
- [x] `User` — auth, premium flag, relationships
- [x] `UserProfile` — personal info, glucose unit, push token, notification settings
- [x] `DiabetesProfile` — diabetes type, targets, CGM, carb ratio, correction factor
- [x] `GlucoseReading` — mmol + mgdl, source, tag, trend, indexed time-series
- [x] `GlucosePrediction` — ML predictions with confidence intervals
- [x] `InsulinDose` — type, delivery, basal/correction flags, IOB-related
- [x] `Meal` + `MealItem` — full nutrition tracking with computed GI/GL
- [x] `FoodDatabase` — local food cache for barcode/name lookups
- [x] `Activity` — type, intensity, duration, glucose before/after
- [x] `Medication` + `MedicationLog` — soft delete, adherence tracking
- [x] `LabResult` — HbA1c, eGFR, LDL, etc.
- [x] `Appointment` — reminders, completion tracking
- [x] `Insight` — AI-generated insights with category/severity
- [x] `GlucosePattern` — computed pattern records (upsertable)
- [x] `CorrelationCache` — pre-computed Pearson/Spearman results
- [x] `MealImpactScore` — personal meal response scores
- [x] `EmergencyContact` — hypo/hyper alert thresholds
- [x] `CarePortalLink` — secure share tokens with permissions
- [x] `SupplyItem` — inventory with depletion estimates
- [x] `Subscription` — plan, status, provider, period

#### Schemas (Pydantic v2)
- [x] Auth: Register, Login, Token, Refresh
- [x] User: Profile update, diabetes profile create/read
- [x] Glucose: Create (with unit conversion), response, list, stats, TIR
- [x] Insulin: Create, response, bolus calculator request/response
- [x] Meal + MealItem: Create (with auto-aggregate), response
- [x] Activity: Create, response
- [x] Insights, patterns, predictions
- [x] Care: emergency contacts, portal links, medications, supplies
- [x] Subscription

#### API Routes
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `POST /api/v1/auth/refresh`
- [x] `GET  /api/v1/auth/me`
- [x] `GET/PATCH /api/v1/users/me/profile`
- [x] `POST /api/v1/users/me/diabetes-profile`
- [x] `POST/GET/DELETE /api/v1/glucose/`
- [x] `GET  /api/v1/glucose/latest`
- [x] `GET  /api/v1/glucose/stats` (with TIR)
- [x] `GET  /api/v1/glucose/patterns` (premium)
- [x] `GET  /api/v1/glucose/hourly-profile` (premium)
- [x] `GET  /api/v1/glucose/daily-averages`
- [x] `POST/GET/DELETE /api/v1/meals/`
- [x] `GET  /api/v1/meals/favourites`
- [x] `POST/GET/DELETE /api/v1/insulin/`
- [x] `POST /api/v1/insulin/bolus-calculator`
- [x] `POST/GET/DELETE /api/v1/activities/`
- [x] `GET  /api/v1/analytics/dashboard`
- [x] `GET  /api/v1/analytics/weekly-report` (premium)
- [x] `GET  /api/v1/analytics/insights` (premium)
- [x] `GET/POST/DELETE /api/v1/care/emergency-contacts`
- [x] `GET/POST/DELETE /api/v1/care/portal-links` (premium)
- [x] `GET/POST/DELETE /api/v1/care/medications`
- [x] `GET/POST /api/v1/care/supplies`
- [x] `GET /health`

#### Services
- [x] `UserService` — create, authenticate, get, update profile, diabetes profile, last login
- [x] `GlucoseService` — CRUD + analytics data fetcher, stats, patterns, hourly profile

#### Analytics Engine (Python)
- [x] `analytics/glucose/engine.py`
  - [x] `compute_stats()` — avg, SD, CV, HbA1c estimate, TIR
  - [x] `compute_tir()` — Time In Range (5 zones)
  - [x] `compute_mage()` — Mean Amplitude of Glycemic Excursions
  - [x] `estimate_hba1c()` — ADAG formula
  - [x] `detect_patterns()` — dawn phenomenon, nocturnal hypo, weekday/weekend, high variability
  - [x] `compute_hourly_profile()` — 24h average with confidence intervals
  - [x] `compute_daily_averages()` — per-day stats for trend charts
  - [x] `compute_hypo_risk_score()` — 0-100 risk score with IOB + activity
- [x] `analytics/nutrition/meal_impact.py`
  - [x] `compute_auc_trapezoidal()` — area under glucose curve
  - [x] `score_meal_impact()` — peak, spike, AUC from post-meal readings
  - [x] `compute_impact_score()` — normalised 0-100 score
  - [x] `aggregate_meal_impacts()` — averages across multiple eating events
- [x] `analytics/correlations/engine.py`
  - [x] `compute_correlations()` — Pearson + Spearman for 8 variable pairs
  - [x] Natural language insight generation
  - [x] Significance testing (p < 0.05)

#### Background Workers (Celery)
- [x] `workers/celery_app.py` — Celery config with beat schedule
- [x] `workers/analytics_tasks.py`
  - [x] `run_daily_analytics` — finds active users, dispatches per-user tasks
  - [x] `compute_user_analytics` — runs patterns, upserts DB records, creates Insights

#### FastAPI App
- [x] `app/main.py` — lifespan, CORS, Sentry, rate limiter, global error handler

---

### Mobile (React Native + TypeScript)

#### Infrastructure
- [x] `package.json` — all dependencies
- [x] `tsconfig.json` — strict + path aliases
- [x] `app.json` — Expo config for Android + iOS
- [x] `App.tsx` — root with GestureHandler, QueryClient, Toast

#### Theme / Design System
- [x] `theme/theme.ts`
  - [x] Full color palette (primary, accent, glucose status, chart)
  - [x] Typography scale (Inter font family, 12 sizes)
  - [x] Spacing scale
  - [x] Border radius scale
  - [x] Shadow presets (sm, md, lg, glow)
  - [x] `getGlucoseColor()` helper
  - [x] `getGlucoseLabel()` helper

#### Navigation
- [x] `navigation/AppNavigator.tsx`
  - [x] Root stack (Auth / Onboarding / Main)
  - [x] Auth stack (Login / Register)
  - [x] Bottom tab navigator (5 tabs)
  - [x] Log stack (Hub / Glucose / Meal / Insulin / Activity)
  - [x] Bootstrap logic (token check → auto-login)
  - [x] Dark NavigationContainer theme

#### Services / API
- [x] `services/api.ts`
  - [x] Axios instance with base URL (dev/prod)
  - [x] Request interceptor (Bearer token)
  - [x] Response interceptor (auto token refresh on 401)
  - [x] `authApi` — register, login, me
  - [x] `glucoseApi` — log, list, latest, stats, patterns, hourly, daily, delete
  - [x] `mealApi` — log, list, favourites, delete
  - [x] `insulinApi` — log, list, bolus calculator, delete
  - [x] `activityApi` — log, list, delete
  - [x] `analyticsApi` — dashboard, weekly report, insights
  - [x] `careApi` — contacts, portal links, medications, supplies
  - [x] `userApi` — me, update profile, diabetes profile

#### State Stores (Zustand)
- [x] `store/authStore.ts` — login, register, logout, loadUser, setUser
- [x] `store/glucoseStore.ts` — readings, latestReading, stats, daily averages, log, delete

#### Components
- [x] `components/common/index.tsx`
  - [x] `Card` — default / elevated / outlined variants
  - [x] `Button` — primary / secondary / ghost / danger, 3 sizes, loading state
  - [x] `Input` — label, error, left/right adornments, disabled state
  - [x] `GlucoseBadge` — colour-coded value + unit + label
  - [x] `SectionHeader` — title + optional right action
  - [x] `EmptyState` — emoji + title + subtitle + optional action
  - [x] `Pill` — coloured tag chip
- [x] `components/charts/TIRRing.tsx`
  - [x] `TIRRing` — 5-zone SVG donut chart with centre label + legend
  - [x] `Sparkline` — minimal line chart using polyline SVG

#### Screens
- [x] `screens/auth/LoginScreen.tsx` — email/password, error banner, show/hide password
- [x] `screens/auth/RegisterScreen.tsx` — name/email/password/confirm, validation
- [x] `screens/auth/OnboardingScreen.tsx` — 3-step: diabetes type, glucose targets, CGM
- [x] `screens/dashboard/DashboardScreen.tsx` — glucose card, TIR ring, quick log row, premium upsell
- [x] `screens/log/LogHubScreen.tsx` — 4 log options
- [x] `screens/log/LogGlucoseScreen.tsx` — value input, mmol/mgdl toggle, tags, notes
- [x] `screens/log/LogMealScreen.tsx` — name, type, macros
- [x] `screens/log/LogInsulinScreen.tsx` — type, units stepper, correction/basal, current glucose
- [x] `screens/log/LogActivityScreen.tsx` — type grid, intensity, duration, glucose before/after
- [x] `screens/insights/InsightsScreen.tsx` — period selector, TIR ring, stats grid, insights list, premium gate
- [x] `screens/care/CareScreen.tsx` — medications, emergency contacts, supplies list
- [x] `screens/profile/ProfileScreen.tsx` — avatar, diabetes type, premium banner, menu, sign out

#### Docs
- [x] `README.md` — full setup guide, tech stack, API reference, env vars

---

## ❌ TODO — NEXT TASKS (Prioritised)

### Backend — HIGH PRIORITY
- [ ] **Alembic initial migration** — `alembic revision --autogenerate -m "initial"`
- [ ] **Food search endpoint** — `/api/v1/food/search?q=` (OpenFoodFacts API + local cache)
- [ ] **Barcode lookup endpoint** — `/api/v1/food/barcode/{code}`
- [ ] **PDF report generation** — `/api/v1/analytics/report` using ReportLab
- [ ] **Lab results CRUD** — routes + service for `/api/v1/care/labs`
- [ ] **Appointments CRUD** — routes + service for `/api/v1/care/appointments`
- [ ] **Push notification service** — Expo push token registration + notification sender
- [ ] **Emergency alert sender** — trigger on hypo/hyper threshold crossing
- [ ] **Correlation endpoint** — `/api/v1/analytics/correlations` (premium)
- [ ] **Meal impact score endpoint** — `/api/v1/analytics/meal-impact` (premium)
- [ ] **Glucose prediction endpoint** — `/api/v1/glucose/predictions` (premium)
- [ ] **Care portal viewer** — `/api/v1/care/portal/{token}` — public read-only
- [ ] **Medication log endpoint** — `POST /api/v1/care/medications/{id}/log`
- [ ] **Supply update endpoint** — `PATCH /api/v1/care/supplies/{id}`
- [ ] **Test suite** — pytest tests for auth, glucose CRUD, analytics engine
- [ ] **Subscription webhook handler** — Google Play / Apple billing events
- [ ] **Avatar upload endpoint** — file upload to local / S3

### Backend — MEDIUM PRIORITY
- [ ] Prophet-based glucose trend forecasting
- [ ] LSTM model training pipeline (after 30+ days of data)
- [ ] Insulin on board (IOB) decay calculator endpoint
- [ ] HbA1c lab result + auto-compare to estimated value
- [ ] Menstrual cycle tracking model + correlation with glucose
- [ ] Exercise insulin sensitivity adjustment logic
- [ ] `SupplyItem` depletion recalculation on usage update
- [ ] Rate limiting per-user (not just per-IP)
- [ ] WebSocket endpoint for real-time CGM data streaming
- [ ] GDPR data export endpoint (full JSON dump)

### Mobile — HIGH PRIORITY
- [ ] **Barcode scanner** — integrate `expo-barcode-scanner` into LogMeal
- [ ] **Food search** — search bar + results list in LogMeal
- [ ] **Bolus calculator screen** — full UI for `/insulin/bolus-calculator`
- [ ] **Glucose history list screen** — paginated, filterable, with delete swipe
- [ ] **Glucose chart screen** — 7/14/30 day line chart with Skia or Victory
- [ ] **Correlation screen** — visual matrix of user's correlations (premium)
- [ ] **Meal impact screen** — list of meal scores (premium)
- [ ] **Care portal share flow** — create link + share sheet
- [ ] **Medication detail + log screen** — mark as taken/skipped
- [ ] **Lab results screen** — list + add new result
- [ ] **Appointments screen** — list + add + reminder
- [ ] **Push notification setup** — register Expo push token on login
- [ ] **Notification settings screen** — per-type toggles
- [ ] **Profile edit screen** — personal info form
- [ ] **Diabetes profile edit screen** — update targets, CGM, ratios
- [ ] **Onboarding improvements** — CGM device selection list
- [ ] **Biometric lock** — `expo-local-authentication` on app resume
- [ ] **Android home screen widget** — current glucose widget

### Mobile — MEDIUM PRIORITY
- [ ] Haptic feedback on successful log
- [ ] Toast notifications for errors
- [ ] Offline queue — log readings offline, sync when back online
- [ ] Dark/light theme toggle (currently dark-first only)
- [ ] Accessibility: large text mode, screen reader labels
- [ ] Colour-blind safe mode for glucose indicators
- [ ] Animated glucose value transitions (Reanimated)
- [ ] Pull-to-refresh on all list screens
- [ ] Date/time picker for backdating logs
- [ ] Swipe-to-delete on list items
- [ ] Skeleton loaders during data fetch
- [ ] Meal favourite toggle in meal list

### Infrastructure / DevOps
- [ ] **Railway deployment config** — `railway.toml` for API + worker
- [ ] **GitHub Actions CI** — lint, test, build on PR
- [ ] **Sentry source maps** — mobile crash reporting
- [ ] **EAS Build setup** — `eas.json` for Android APK/AAB builds
- [ ] **Google Play Store** — `android/` native setup, signing config
- [ ] **Environment-specific API URLs** — dev / staging / prod
- [ ] **Database backups** — automated pg_dump to S3
- [ ] **Health check alerting** — notify on API down

---

## HOW TO USE THIS FILE IN NEW CHATS

Start each new chat with:

> "I'm building GlucoSense. Here's the TASKS.md. Continue from the next TODO item: [paste the specific task you want to work on]."

This ensures continuity without re-explaining the full project.
