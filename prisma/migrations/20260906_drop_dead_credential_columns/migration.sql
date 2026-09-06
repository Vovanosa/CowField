-- Drops the credential storage Neon Auth replaced.
--
-- `password_hash`, `google_id` and the whole `password_reset_tokens` table have been dead since
-- Neon Auth took over sign-in: the browser authenticates against Neon directly, and this API only
-- verifies the resulting JWT. Nothing has written a non-null value to either column since, and the
-- server was carrying them through its repository and service layers as permanent nulls.
--
-- THIS IS NOT REVERSIBLE WITHOUT A BACKUP. Dropping a column discards its data. Take a snapshot
-- before applying.

-- DropTable
-- Takes `password_reset_tokens_user_id_fkey` and the table's indexes with it. A separate
-- DROP CONSTRAINT would error once the table is gone, so it is not written out.
DROP TABLE IF EXISTS "password_reset_tokens";

-- DropIndex
DROP INDEX IF EXISTS "users_google_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";
ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id";
