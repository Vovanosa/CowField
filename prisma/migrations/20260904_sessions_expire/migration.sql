-- Sessions had no expiry at all: `token` was the primary key, nothing ever removed a row except an
-- explicit logout, and the table grew by one row per login and per guest entry, forever.
--
-- Adds an absolute `expires_at`, set once at creation. `PrismaSessionRepository.getByToken` refuses
-- anything past it and deletes the row on the way through, and `npm run sessions:prune` clears the
-- backlog. TTLs live in `server/src/auth/sessionExpiry.ts`: 7 days for admin/user (the row is only a
-- cache for a Neon JWT, so losing it costs one slower request) and 30 days for guests (the row IS
-- their credential, though their progress is client-local and survives regardless).

-- Nullable first, so the backfill has somewhere to write.
ALTER TABLE "sessions" ADD COLUMN "expires_at" TIMESTAMP(3);

-- Backfilled from **now**, not from `created_at`, deliberately: dating existing rows retroactively
-- would sign out every guest whose session predates the TTL the moment this runs. Everyone instead
-- gets one full window from the migration, and expiry applies normally from there.
UPDATE "sessions"
SET "expires_at" = now() + CASE WHEN "role" = 'guest' THEN INTERVAL '30 days' ELSE INTERVAL '7 days' END
WHERE "expires_at" IS NULL;

ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET NOT NULL;

-- Supports both the per-token expiry check and the bulk prune.
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
