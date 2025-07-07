begin;

alter table aggregate_user add column if not exists total_track_count int default 0;

UPDATE aggregate_user au
SET total_track_count = track_stats.total_count
FROM (
  SELECT
    t.owner_id AS user_id,
    COUNT(*) AS total_count
  FROM tracks t
  WHERE
    t.is_current IS TRUE
    AND t.is_delete IS FALSE
    AND t.is_available IS TRUE
    AND t.stem_of IS NULL
  GROUP BY t.owner_id
) AS track_stats
WHERE au.user_id = track_stats.user_id;

commit;

