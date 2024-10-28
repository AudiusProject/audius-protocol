BEGIN;

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS cover_attribution JSONB,
ADD COLUMN IF NOT EXISTS is_owned_by_user BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tracks.cover_attribution IS 'JSON structure for cover song attribution: { original_song_title?: string, original_song_artist?: string }';
COMMENT ON COLUMN tracks.is_owned_by_user IS 'Indicates whether the track is owned by the user for publishing payouts';

COMMIT;
