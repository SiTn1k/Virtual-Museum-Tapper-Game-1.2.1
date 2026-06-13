/*
# Game Progress Table for Telegram Mini App

## Overview
Creates storage for game progress synced across devices using Telegram user ID.
Each user's progress is stored and retrieved by their Telegram ID.

## New Tables
- `game_progress`
  - `id` (uuid, primary key)
  - `telegram_id` (bigint, unique) - Telegram user ID for identification
  - `level` (integer) - Current level
  - `xp` (real) - Current XP in level
  - `total_xp` (real) - Total XP earned
  - `currency` (real) - Current currency
  - `total_currency_earned` (real) - Total currency earned
  - `tap_power` (integer) - Tap strength
  - `owned_generators` (jsonb) - Array of owned generators with levels
  - `unlocked_epochs` (text[]) - Array of unlocked epoch IDs
  - `artifact_parts` (jsonb) - Artifact parts collected
  - `completed_artifacts` (text[]) - Completed artifact IDs
  - `last_saved_at` (timestamptz) - Last sync time

## Security
- Enable RLS on `game_progress`.
- Allow anon access for Telegram Mini App (uses telegram_id, not auth).
- Anyone can read/write using telegram_id as key.

## Note
Telegram Mini Apps pass user ID via initData, so we use telegram_id 
instead of auth.uid() for user identification.
*/

CREATE TABLE IF NOT EXISTS game_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE,
  
  level integer NOT NULL DEFAULT 1,
  xp real NOT NULL DEFAULT 0,
  xp_to_next_level real NOT NULL DEFAULT 100,
  total_xp real NOT NULL DEFAULT 0,
  
  currency real NOT NULL DEFAULT 20,
  total_currency_earned real NOT NULL DEFAULT 20,
  tap_power integer NOT NULL DEFAULT 1,
  passive_xp_per_second real NOT NULL DEFAULT 0,
  
  owned_generators jsonb NOT NULL DEFAULT '[]',
  unlocked_epochs text[] NOT NULL DEFAULT ARRAY['trypillia'],
  
  artifact_parts jsonb NOT NULL DEFAULT '{}',
  completed_artifacts text[] NOT NULL DEFAULT '{}',
  
  last_saved_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- Allow anon access (Telegram Mini App uses anon key)
DROP POLICY IF EXISTS "anon_read_progress" ON game_progress;
CREATE POLICY "anon_read_progress" ON game_progress FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_progress" ON game_progress;
CREATE POLICY "anon_insert_progress" ON game_progress FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_progress" ON game_progress;
CREATE POLICY "anon_update_progress" ON game_progress FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Index for fast telegram_id lookups
CREATE INDEX IF NOT EXISTS idx_game_progress_telegram ON game_progress(telegram_id);