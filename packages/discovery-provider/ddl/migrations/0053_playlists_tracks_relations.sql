begin;

CREATE TABLE IF NOT EXISTS playlists_tracks_relations (
  playlist_id integer NOT NULL,
  track_id integer NOT NULL,
  is_current boolean NOT NULL,
  created_at timestamp with time zone NOT NULL,
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_playlist_ids ON playlists_tracks_relations USING btree (playlist_id, created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_tracks_relations_track_ids ON playlists_tracks_relations USING btree (track_id, created_at);

commit;
