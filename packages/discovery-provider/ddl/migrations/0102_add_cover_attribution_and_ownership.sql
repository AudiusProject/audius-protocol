BEGIN;

ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS cover_original_song_title VARCHAR,
ADD COLUMN IF NOT EXISTS cover_original_artist VARCHAR,
ADD COLUMN IF NOT EXISTS is_owned_by_user BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN tracks.cover_original_song_title IS 'Title of the original song if this track is a cover';
COMMENT ON COLUMN tracks.cover_original_artist IS 'Artist of the original song if this track is a cover';
COMMENT ON COLUMN tracks.is_owned_by_user IS 'Indicates whether the track is owned by the user for publishing payouts';

COMMIT;
