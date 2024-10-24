BEGIN;

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS cover_attribution JSONB;

COMMENT ON COLUMN tracks.cover_attribution IS 'JSON structure for cover song attribution: { original_song_title?: string, original_song_artist?: string }';

COMMIT;
