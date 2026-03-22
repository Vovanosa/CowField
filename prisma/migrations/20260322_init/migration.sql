-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "SessionRole" AS ENUM ('admin', 'user', 'guest');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'guest');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('light', 'easy', 'medium', 'hard');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "role" "AccountRole" NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_profiles" (
    "id" TEXT NOT NULL,
    "actor_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT 'Guest',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "token" TEXT NOT NULL,
    "actor_key" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "role" "SessionRole" NOT NULL,
    "user_id" TEXT,
    "guest_profile_id" TEXT,
    "email" TEXT,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_settings" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "user_id" TEXT,
    "guest_profile_id" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sound_effects_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sound_effects_volume" INTEGER NOT NULL DEFAULT 50,
    "music_enabled" BOOLEAN NOT NULL DEFAULT false,
    "music_volume" INTEGER NOT NULL DEFAULT 50,
    "dark_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "take_your_time_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_place_dots_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_progress" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "user_id" TEXT,
    "guest_profile_id" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "level_number" INTEGER NOT NULL,
    "best_time_seconds" INTEGER,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_statistics_totals" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "user_id" TEXT,
    "guest_profile_id" TEXT,
    "total_completed_levels" INTEGER NOT NULL DEFAULT 0,
    "total_bull_placements" INTEGER NOT NULL DEFAULT 0,
    "total_completion_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_statistics_totals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_statistics_by_difficulty" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "user_id" TEXT,
    "guest_profile_id" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "completed_levels" INTEGER NOT NULL DEFAULT 0,
    "fastest_level_number" INTEGER,
    "fastest_time_seconds" INTEGER,
    "average_time_seconds" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_statistics_by_difficulty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "level_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "grid_size" INTEGER NOT NULL,
    "pens_by_cell" JSONB NOT NULL,
    "cows_by_cell" JSONB NOT NULL,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_entries" (
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "updated_by_user_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_entries_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "guest_profiles_actor_key_key" ON "guest_profiles"("actor_key");

-- CreateIndex
CREATE INDEX "sessions_actor_key_idx" ON "sessions"("actor_key");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_guest_profile_id_idx" ON "sessions"("guest_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "player_settings_actor_type_idx" ON "player_settings"("actor_type");

-- CreateIndex
CREATE UNIQUE INDEX "player_settings_user_id_unique" ON "player_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_settings_guest_profile_id_unique" ON "player_settings"("guest_profile_id");

-- CreateIndex
CREATE INDEX "level_progress_actor_type_idx" ON "level_progress"("actor_type");

-- CreateIndex
CREATE INDEX "level_progress_level_lookup_idx" ON "level_progress"("difficulty", "level_number");

-- CreateIndex
CREATE UNIQUE INDEX "level_progress_user_level_unique" ON "level_progress"("user_id", "difficulty", "level_number");

-- CreateIndex
CREATE UNIQUE INDEX "level_progress_guest_level_unique" ON "level_progress"("guest_profile_id", "difficulty", "level_number");

-- CreateIndex
CREATE INDEX "player_statistics_totals_actor_type_idx" ON "player_statistics_totals"("actor_type");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_totals_user_id_unique" ON "player_statistics_totals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_totals_guest_profile_id_unique" ON "player_statistics_totals"("guest_profile_id");

-- CreateIndex
CREATE INDEX "player_statistics_by_difficulty_actor_type_idx" ON "player_statistics_by_difficulty"("actor_type");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_by_difficulty_user_unique" ON "player_statistics_by_difficulty"("user_id", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "player_statistics_by_difficulty_guest_unique" ON "player_statistics_by_difficulty"("guest_profile_id", "difficulty");

-- CreateIndex
CREATE INDEX "levels_created_by_user_id_idx" ON "levels"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "levels_difficulty_level_number_unique" ON "levels"("difficulty", "level_number");

-- CreateIndex
CREATE INDEX "content_entries_updated_by_user_id_idx" ON "content_entries"("updated_by_user_id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "guest_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_settings" ADD CONSTRAINT "player_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_settings" ADD CONSTRAINT "player_settings_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "guest_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_progress" ADD CONSTRAINT "level_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_progress" ADD CONSTRAINT "level_progress_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "guest_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics_totals" ADD CONSTRAINT "player_statistics_totals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics_totals" ADD CONSTRAINT "player_statistics_totals_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "guest_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics_by_difficulty" ADD CONSTRAINT "player_statistics_by_difficulty_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_statistics_by_difficulty" ADD CONSTRAINT "player_statistics_by_difficulty_guest_profile_id_fkey" FOREIGN KEY ("guest_profile_id") REFERENCES "guest_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "levels" ADD CONSTRAINT "levels_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_entries" ADD CONSTRAINT "content_entries_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

