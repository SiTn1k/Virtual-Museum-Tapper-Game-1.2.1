/*
# Referral System for Telegram Mini App

## Overview
Adds referral tracking and leaderboard functionality.
Users can invite friends and earn bonuses.

## Modified Tables
- `game_progress` - added referral tracking fields:
  - `referrer_id` (bigint) - Telegram ID of user who invited this player
  - `referrals_count` (integer) - Number of friends invited
  - `referral_earnings` (real) - Total currency earned from referrals
  - `username` (text) - Telegram username for display
  - `first_name` (text) - Telegram first name for display

## Security
- Uses existing anon/authenticated policies
- All users can read leaderboard data (needed for rankings)

## Note
Referral bonuses: 100 currency for inviter + 50 for new player
*/

ALTER TABLE game_progress 
ADD COLUMN IF NOT EXISTS referrer_id bigint,
ADD COLUMN IF NOT EXISTS referrals_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_earnings real NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS photo_url text;

-- Create index for referrer queries
CREATE INDEX IF NOT EXISTS idx_game_progress_referrer ON game_progress(referrer_id);

-- Create index for leaderboard sorting (by total_xp)
CREATE INDEX IF NOT EXISTS idx_game_progress_total_xp ON game_progress(total_xp DESC);

-- Create index for referral count sorting
CREATE INDEX IF NOT EXISTS idx_game_progress_referrals ON game_progress(referrals_count DESC);