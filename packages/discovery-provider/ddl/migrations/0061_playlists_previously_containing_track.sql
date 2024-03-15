BEGIN;

-- disable triggers
ALTER TABLE tracks DISABLE trigger on_track;
ALTER TABLE tracks DISABLE trigger trg_tracks;

ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS playlists_previously_containing_track JSONB NOT NULL DEFAULT jsonb_build_object('playlists', json_build_array());

-- enable triggers
ALTER TABLE tracks ENABLE trigger on_track;
ALTER TABLE tracks ENABLE trigger trg_tracks;

COMMIT;
