BEGIN;

CREATE TABLE IF NOT EXISTS playlists_tracks_relations (
  playlist_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  is_delete BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_playlist_ids ON playlists_tracks_relations USING btree (playlist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_track_ids ON playlists_tracks_relations USING btree (track_id, created_at);

INSERT INTO playlists_tracks_relations (playlist_id, track_id, is_delete) 
SELECT playlist_id, track_id, FALSE
FROM (
    SELECT
        playlist_id,
        CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id
    FROM playlists
) AS subquery
WHERE track_id IS NOT NULL;


-- SELECT playlist_id, CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' as INTEGER), FALSE FROM playlists ON CONFLICT DO NOTHING;

COMMIT;
