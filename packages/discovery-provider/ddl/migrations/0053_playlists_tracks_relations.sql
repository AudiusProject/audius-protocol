BEGIN;

CREATE TABLE IF NOT EXISTS playlists_tracks_relations (
  playlist_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  is_delete BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_playlist_ids ON playlists_tracks_relations USING btree (playlist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_track_ids ON playlists_tracks_relations USING btree (track_id, created_at);

COMMIT;
