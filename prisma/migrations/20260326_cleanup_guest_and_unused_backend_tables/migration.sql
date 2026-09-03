-- Remove backend settings/content persistence that is now frontend-local/static
DROP TABLE IF EXISTS "content_entries" CASCADE;
DROP TABLE IF EXISTS "player_settings" CASCADE;

-- Remove no-longer-used guest profile table and precomputed difficulty statistics
DROP TABLE IF EXISTS "player_statistics_by_difficulty" CASCADE;
DROP TABLE IF EXISTS "guest_profiles" CASCADE;

-- Remove guest-owned backend rows before dropping guest profile columns
DELETE FROM "player_statistics_totals" WHERE "actor_type" = 'guest';
DELETE FROM "level_progress" WHERE "actor_type" = 'guest';

-- Remove guest profile references from remaining tables
DROP INDEX IF EXISTS "sessions_guest_profile_id_idx";
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "guest_profile_id";

DROP INDEX IF EXISTS "level_progress_guest_level_unique";
ALTER TABLE "level_progress" DROP COLUMN IF EXISTS "guest_profile_id";

DROP INDEX IF EXISTS "player_statistics_totals_guest_profile_id_unique";
ALTER TABLE "player_statistics_totals" DROP COLUMN IF EXISTS "guest_profile_id";
