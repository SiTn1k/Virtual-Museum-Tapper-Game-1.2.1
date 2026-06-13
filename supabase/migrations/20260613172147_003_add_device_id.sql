-- Add device_id as fallback identifier when no Telegram WebApp
ALTER TABLE game_progress ADD COLUMN IF NOT EXISTS device_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_progress_device_id
  ON game_progress(device_id)
  WHERE device_id IS NOT NULL AND telegram_id IS NULL;