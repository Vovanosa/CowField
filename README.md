# Cowfield

Calm, grid-based logic puzzle game inspired by Bullpen, built with React, Vite, TypeScript, Express, PostgreSQL, and Prisma.

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL
- ORM / migrations: Prisma
- Auth roles: `admin`, `user`, `guest`

## Main Commands

Install dependencies:

```powershell
npm install
```

Start the frontend dev server:

```powershell
npm run dev
```

Start the backend once:

```powershell
npm run server:start
```

Start the backend in watch mode:

```powershell
npm run server:dev
```

Run the main checks:

```powershell
npm run lint
npm run typecheck
npm run typecheck:server
npm run check
```

Build the frontend:

```powershell
npm run build
```

Preview the frontend production build:

```powershell
npm run preview
```

## Database Commands

Generate the Prisma client:

```powershell
npm run db:generate
```

Apply committed migrations:

```powershell
npm run db:migrate:deploy
```

Create a new local development migration:

```powershell
npm run db:migrate:dev
```

Push schema changes without creating a migration:

```powershell
npm run db:push
```

Import legacy JSON backup data into PostgreSQL:

```powershell
npm run db:import
```

## Local Run Flow

1. Make sure PostgreSQL is running locally.
2. Configure `.env`.
3. Apply migrations.
4. Start the backend.
5. Start the frontend.

Typical local sequence:

```powershell
npm install
npm run db:generate
npm run db:migrate:deploy
npm run server:start
```

In a second terminal:

```powershell
npm run dev
```

Frontend usually runs on `http://localhost:5173`.
Backend usually runs on `http://localhost:4000`.

## Environment

Main local env values:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/cowfield?schema=public
DIRECT_URL=postgresql://postgres:password@localhost:5432/cowfield?schema=public
PORT=4000
BULLPEN_ADMIN_EMAIL=your-admin@example.com
ALLOWED_ORIGINS=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
GOOGLE_FRONTEND_CALLBACK_URL=http://localhost:5173/auth/google/callback
GOOGLE_STATE_SECRET=...
```

See [.env.example](/c:/Users/mykha/OneDrive/Desktop/CowField/.env.example) for the current template.

## How It Works Now

- The frontend talks only to the backend API.
- The backend talks to PostgreSQL through Prisma.
- Levels, content, users, sessions, settings, progress, guest data, and statistics persistence now live in PostgreSQL.
- Legacy runtime JSON storage is no longer part of the active app path.

Runtime flow:

```text
browser -> React app -> Express API -> Prisma -> PostgreSQL
```

## Seeing The Database

Open `psql`:

```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -p 5432 -U postgres -d cowfield
```

Useful SQL:

```sql
\dt
SELECT difficulty, COUNT(*) FROM levels GROUP BY difficulty ORDER BY difficulty;
SELECT difficulty, level_number, title FROM levels ORDER BY difficulty, level_number LIMIT 20;
SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM content_entries;
```

Or use pgAdmin:

1. Connect to `localhost:5432`
2. Open database `cowfield`
3. Open `Schemas -> public -> Tables`

Important tables:

- `users`
- `sessions`
- `guest_profiles`
- `password_reset_tokens`
- `player_settings`
- `level_progress`
- `player_statistics_totals`
- `player_statistics_by_difficulty`
- `levels`
- `content_entries`

## Project Structure

```text
prisma/
  migrations/
  schema.prisma

server/
  src/
    auth/
    controllers/
    db/
    middleware/
    repositories/
    routes/
    schemas/
    scripts/
    services/
    types/
    utils/
    app.ts
    index.ts

src/
  app/
  assets/
  components/
  game/
    levels/
    rules/
    storage/
    types/
    validation/
  locales/
  pages/
  styles/
  App.tsx
  main.tsx
```

## Important Files

- App entry: [src/main.tsx](/c:/Users/mykha/OneDrive/Desktop/CowField/src/main.tsx)
- Frontend router/app shell: [src/App.tsx](/c:/Users/mykha/OneDrive/Desktop/CowField/src/App.tsx)
- Backend entry: [server/src/index.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/server/src/index.ts)
- Backend app wiring: [server/src/app.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/server/src/app.ts)
- Prisma schema: [prisma/schema.prisma](/c:/Users/mykha/OneDrive/Desktop/CowField/prisma/schema.prisma)
- Prisma client setup: [server/src/db/prismaClient.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/server/src/db/prismaClient.ts)
- Repository composition: [server/src/repositories/createRepositories.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/server/src/repositories/createRepositories.ts)
- Level API client: [src/game/storage/levelStorage.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/src/game/storage/levelStorage.ts)
- Auth API client: [src/game/storage/authSessionStorage.ts](/c:/Users/mykha/OneDrive/Desktop/CowField/src/game/storage/authSessionStorage.ts)

## Current Status

- Database migration is complete for active runtime storage.
- The app now runs in DB-backed mode.
- Level content is served from PostgreSQL.
- Shared content is served from PostgreSQL.
- Startup performs a database health check.
- The configured admin email is enforced as the single admin account.
- The frontend can target a separate backend host through `VITE_API_BASE_URL`.
- The backend now uses `ALLOWED_ORIGINS` for deployment-safe CORS control.
- `DIRECT_URL` can be used for Prisma CLI commands when the runtime `DATABASE_URL` uses a pooled host such as a Neon pooler URL.

## Deployment Direction

To show this online, you need:

1. a frontend host for the Vite build
2. a backend host for the Express API
3. a managed PostgreSQL database
4. production env variables for backend and frontend URLs
5. Google OAuth callback URLs updated for the public domain

Practical simple stack:

- Frontend: Vercel or Netlify
- Backend: Render, Railway, or Fly.io
- Database: Neon, Supabase Postgres, Railway Postgres, or Render Postgres
