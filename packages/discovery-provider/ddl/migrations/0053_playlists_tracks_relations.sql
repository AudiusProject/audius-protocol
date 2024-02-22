BEGIN;

CREATE TABLE IF NOT EXISTS collection_track_relations (
  collection_id INTEGER NOT NULL,
  track_id INTEGER NOT NULL,
  is_delete BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_track_relations_collection_ids ON collection_track_relations USING btree (collection_id, created_at);
CREATE INDEX IF NOT EXISTS idx_collection_track_relations_track_ids ON collection_track_relations USING btree (track_id, created_at);

INSERT INTO collection_track_relations (collection_id, track_id, is_delete) 
SELECT playlist_id, track_id, FALSE
FROM (
    SELECT
        playlist_id,
        CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id
    FROM playlists
) AS subquery
WHERE track_id IS NOT NULL ON CONFLICT DO NOTHING;

COMMIT;
