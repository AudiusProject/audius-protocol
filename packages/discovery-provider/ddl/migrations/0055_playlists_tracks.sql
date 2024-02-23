BEGIN;

CREATE TABLE IF NOT EXISTS playlists_tracks (
  playlist_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  is_removed BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_tracks_track_id ON playlists_tracks USING btree (track_id, created_at);

INSERT INTO playlists_tracks (playlist_id, track_id, is_removed) 
SELECT playlist_id, track_id, FALSE
FROM (
    SELECT
        playlist_id,
        CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id
    FROM playlists
) AS subquery
WHERE track_id IS NOT NULL ON CONFLICT DO NOTHING;

COMMIT;
