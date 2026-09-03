-- "Total completion time" used to be computed as SUM(best_time_seconds) over level_progress, so it
-- went DOWN whenever a player improved a level. It is now a lifetime accumulator on
-- player_statistics_totals.total_completion_time_seconds, incremented by every completion.
--
-- Seed it once from the existing best-times sum, so nobody's figure visibly resets to zero. That
-- sum is a reasonable lower bound on time actually played: it is what the page already showed.

-- Players with progress but no totals row yet.
INSERT INTO "player_statistics_totals" (
    "id",
    "actor_type",
    "user_id",
    "total_bull_placements",
    "total_completion_time_seconds",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    'user'::"ActorType",
    "level_progress"."user_id",
    0,
    COALESCE(SUM("level_progress"."best_time_seconds"), 0),
    now()
FROM "level_progress"
WHERE "level_progress"."user_id" IS NOT NULL
  AND "level_progress"."best_time_seconds" IS NOT NULL
GROUP BY "level_progress"."user_id"
ON CONFLICT ("user_id") DO NOTHING;

-- Players who already have a totals row (from bull placements) but an untouched time counter.
UPDATE "player_statistics_totals" AS t
SET "total_completion_time_seconds" = s."total"
FROM (
    SELECT
        "user_id",
        COALESCE(SUM("best_time_seconds"), 0) AS "total"
    FROM "level_progress"
    WHERE "user_id" IS NOT NULL
      AND "best_time_seconds" IS NOT NULL
    GROUP BY "user_id"
) AS s
WHERE t."user_id" = s."user_id"
  AND t."total_completion_time_seconds" = 0;

-- Never written and never read: the completed-levels count is derived from level_progress.
ALTER TABLE "player_statistics_totals" DROP COLUMN "total_completed_levels";
