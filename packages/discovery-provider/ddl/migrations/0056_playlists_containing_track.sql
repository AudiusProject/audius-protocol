BEGIN;

ALTER TABLE tracks
ADD column IF NOT EXISTS playlists_containing_track INTEGER[] NOT NULL DEFAULT '{}';

UPDATE tracks SET playlists_containing_track = subquery.playlists_containing_track FROM (
  SELECT
      CAST(jsonb_array_elements(playlist_contents->'track_ids')->>'track' AS INTEGER) AS track_id,
      ARRAY_AGG(playlist_id) AS playlists_containing_track
  FROM playlists
  WHERE playlist_id IS NOT NULL
  GROUP BY track_id
) AS subquery
WHERE tracks.track_id = subquery.track_id
	AND subquery.track_id IS NOT NULL
AND tracks.track_id IS NOT NULL;

COMMIT;
