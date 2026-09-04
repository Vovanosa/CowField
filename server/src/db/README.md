# Database access

Two files, both small:

- **`config.ts`** — `getDatabaseUrl()` and `requireEnvironmentVariable()`. Both **throw** rather than
  defaulting: a missing `DATABASE_URL` or `BULLPEN_ADMIN_EMAIL` is a hard startup failure, not a
  silent fallback.
- **`prismaClient.ts`** — `getPrismaClient()`, a lazy singleton wrapping `PrismaClient` with the
  `@prisma/adapter-pg` driver adapter.

The schema is `prisma/schema.prisma`; migrations are hand-written SQL under `prisma/migrations/`.
Startup (`server/src/index.ts`) runs `$connect()` and `SELECT 1` **before** `listen`, so an
unreachable database fails fast instead of surfacing as 500s later.

## First run

```
cp .env.example .env      # then fill in DATABASE_URL and BULLPEN_ADMIN_EMAIL
npm run db:generate
npm run db:migrate:deploy
npm run server:dev
```

`.env.example` is the authoritative list of environment variables — read it rather than a copy here.
`DIRECT_URL` exists for Prisma CLI commands when `DATABASE_URL` is a pooled connection.

## Housekeeping

`npm run sessions:prune` deletes expired session rows (`--dry-run` to just report). Sessions carry an
absolute `expires_at`; `getByToken` also deletes an expired row when it encounters one, so the script
is only for tokens nobody presents again.

## Notes

- **There is no import script.** An earlier `npm run db:import` for legacy JSON backups is gone,
  along with the file-backed runtime it migrated from.
- **Guests have no rows in this database.** The `guest_profiles` table and every
  `guest_profile_id` column were dropped by the `20260326_cleanup_guest_and_unused_backend_tables`
  migration. Guest progress and all player settings are client-local, for every role.
- `actor_type` / nullable `user_id` columns are a leftover of the old dual-actor design. In practice
  every row now has `actor_type = 'user'` and a non-null `user_id`.
