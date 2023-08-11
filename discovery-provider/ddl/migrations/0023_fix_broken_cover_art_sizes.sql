WITH cover_art_cte AS (
  SELECT track_id, owner_id, cover_art_sizes, (
    SELECT
      cover_art_sizes
    FROM tracks
    WHERE
      track_id = t1.track_id
      AND is_current = FALSE
      AND cover_art_sizes NOT LIKE 'blob%' 
      AND cover_art_sizes NOT LIKE 'file%'
    ORDER BY blocknumber DESC LIMIT 1
  ) AS old_cover_art_sizes
  FROM tracks AS t1
  WHERE is_current = TRUE
    AND (
      cover_art_sizes LIKE 'blob%' 
      OR cover_art_sizes LIKE 'file%' 
    )
)
UPDATE tracks
SET cover_art_sizes = cover_art_cte.old_cover_art_sizes
FROM cover_art_cte
WHERE tracks.track_id = cover_art_cte.track_id
  AND tracks.owner_Id = cover_art_cte.owner_Id
  AND tracks.is_current = TRUE;
