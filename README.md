# PaceForge — Running Training Plan System

A production-ready, rule-based half marathon training plan web application built with Next.js 16, Prisma 7, NextAuth.js, and Tailwind CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Authentication | NextAuth.js v5 (Google OAuth 2.0) |
| Styling | Tailwind CSS v4 |

---

## Getting Started

### 1. Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a hosted instance)

### 2. Clone & install

```bash
cd paceforge-app
npm install
```

### 3. Environment variables

Copy `.env.local` and fill in your values:

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paceforge"
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
```

Also update `.env` (used by Prisma CLI):
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paceforge"
```

#### Getting Google OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI

### 4. Set up the database

```bash
# Create and apply schema
npx prisma migrate dev --name init

# Or push schema directly (no migration history)
npx prisma db push
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
paceforge-app/
├── app/                          # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   ├── plans/                # GET /api/plans
│   │   ├── plans/[planId]/weeks/ # GET /api/plans/:id/weeks
│   │   └── workouts/[workoutId]/ # PATCH /api/workouts/:id
│   ├── dashboard/                # Dashboard page
│   ├── onboarding/               # Plan creation wizard
│   ├── plans/[planId]/           # Full plan view with all 12 weeks
│   └── signin/                   # Google sign-in page
├── components/
│   ├── ui/                       # Button, Card, Badge, Progress
│   └── training/                 # WorkoutCard, WeekView, PlanStats
├── features/
│   └── training-plan/
│       ├── generator.ts          # Rule-based plan generation logic
│       └── actions.ts            # Server actions (create, fetch, update)
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   └── utils.ts                  # Utilities, formatters, constants
├── prisma/
│   └── schema.prisma             # Database models
├── proxy.ts                      # Route protection middleware
└── types/
    └── next-auth.d.ts            # Session type augmentation
```

---

## Training Plan Generation Rules

The generator (`features/training-plan/generator.ts`) follows these rules:

| Rule | Implementation |
|---|---|
| 10% weekly mileage increase | Each week's volume = previous × 1.1 |
| Cutback every 4th week | Weeks 4, 8, 12 → 80% of previous week |
| 1 long run per week | Always Sunday or last training day |
| Max 2 hard workouts/week | Tempo + Interval only in Build/Peak phases |
| At least 1 rest day | Rest days fill non-training days |
| Phase-based intensity | BASE: easy only → BUILD: +tempo → PEAK: +intervals → TAPER: reduced |

### Training Phases

| Phase | Weeks | Focus |
|---|---|---|
| Base | 1–3 | Aerobic base, easy running only |
| Build | 4–7 | Add tempo runs, increase volume |
| Peak | 8–10 | Maximum volume + interval sessions |
| Taper | 11–12 | Reduce volume, maintain intensity |

### Pace Zones (derived from goal time)

If you set a goal finish time, paces are automatically calculated:

- **Easy**: Race pace × 1.30
- **Long Run**: Race pace × 1.25
- **Tempo**: Race pace × 0.97 (comfortably hard)
- **Interval**: Race pace × 0.90 (hard effort)

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/plans` | Fetch all plans for the authenticated user |
| `GET` | `/api/plans/:planId/weeks` | Fetch all weeks with workouts for a plan |
| `PATCH` | `/api/workouts/:workoutId` | Update workout status or reschedule date |

All endpoints require authentication (session cookie).

**PATCH body examples:**
```json
// Mark as completed
{ "status": "COMPLETED" }

// Skip a workout
{ "status": "SKIPPED" }

// Reschedule
{ "newDate": "2026-05-15" }
```

---

## Database Schema

```
User ──< TrainingPlan ──< Week ──< Workout
```

Key relationships:
- A user can have multiple training plans
- Each plan has exactly 12 weeks
- Each week contains 7 workouts (training days + rest days)

---

## Features

- **Google Sign-In** — one-click OAuth authentication
- **3-step onboarding wizard** — experience level, mileage, goal time, start date
- **12-week plan generator** — fully rule-based, deterministic output
- **Dashboard** — current week view, upcoming workouts, progress stats
- **Full plan view** — all 12 weeks grouped by phase with volume chart
- **Workout actions** — mark complete, skip, with optimistic UI
- **Mobile responsive** — works on all screen sizes
- **Progress tracking** — completed workout counter + percentage bar
