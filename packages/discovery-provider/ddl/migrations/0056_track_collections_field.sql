BEGIN;

ALTER TABLE tracks
ADD column IF NOT EXISTS collections_containing_track INTEGER[] DEFAULT NULL;

UPDATE tracks SET collections_containing_track = subquery.collections_containing_track FROM (
  SELECT
      CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id,
      ARRAY_AGG(playlist_id) AS collections_containing_track
  FROM playlists
  WHERE playlist_id IS NOT NULL
  GROUP BY track_id
) AS subquery
WHERE tracks.track_id = subquery.track_id
	AND subquery.track_id IS NOT NULL
AND tracks.track_id IS NOT NULL;

COMMIT;
