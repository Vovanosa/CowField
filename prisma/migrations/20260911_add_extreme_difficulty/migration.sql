-- Adds the fifth difficulty: `extreme`, a 15x15 board with 15 pens and 3 bulls in every row,
-- column and pen.
--
-- `Difficulty` is a Postgres enum, so a new difficulty is a schema change rather than just data.
-- `ADD VALUE IF NOT EXISTS` makes the migration safe to re-run, and the value is only *added* here —
-- nothing in this migration reads or writes it, which is what keeps it legal inside the transaction
-- Prisma wraps migrations in.
ALTER TYPE "Difficulty" ADD VALUE IF NOT EXISTS 'extreme';
