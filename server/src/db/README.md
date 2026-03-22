PostgreSQL migration foundation for the local API.

Current state:
- Prisma is the selected schema and migration tool.
- Prisma 7 datasource configuration lives in `prisma.config.ts`.
- The schema lives in `prisma/schema.prisma`.
- The first generated SQL migration lives in `prisma/migrations/20260322_init/migration.sql`.
- Runtime is database-backed.
- Startup now fails fast if `DATABASE_URL` is missing or the database is unreachable.
- The configured backend admin email is enforced as the single admin account during seeding/import cleanup.

Expected environment:
- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`
- `BULLPEN_ADMIN_EMAIL=admin@example.com`
- `ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain`
- `VITE_API_BASE_URL=http://localhost:4000` on the frontend side

Suggested first-use flow:
- create the PostgreSQL database
- set `DATABASE_URL` in `.env`
- run `npm run db:generate`
- run `npm run db:migrate:deploy` or apply `prisma/migrations/20260322_init/migration.sql`
- run `npm run db:import` only if you have legacy JSON backup data to copy into the database
- start the server and verify login, guest entry, settings save, level completion, and statistics flow

Notes:
- Guest actors use a dedicated `guest_profiles` table.
- Actor-bound tables use nullable `user_id` / `guest_profile_id` columns for now.
- The old file-backed runtime path has been removed.
- The import script is intended for one-way migration from legacy JSON backups into PostgreSQL.
