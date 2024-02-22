BEGIN;

  alter table tracks
  add column if not exists collections_containing_track jsonb default null;

UPDATE tracks SET collections_containing_track = subquery.collections_containing_track FROM (
  SELECT
      CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id,
      ARRAY_AGG(playlist_id) as collections_containing_track
  FROM playlists
  GROUP BY track_id
  -- WHERE collection_list IS NOT NULL ?
) AS subquery
WHERE tracks.track_id = subquery.track_id;
and track_id IS NOT NULL ON CONFLICT DO NOTHING;

COMMIT;
