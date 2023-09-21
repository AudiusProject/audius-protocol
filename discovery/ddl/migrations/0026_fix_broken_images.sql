BEGIN;
-- Tracks
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
      AND cover_art_sizes NOT LIKE '/data/user/%'
      AND cover_art_sizes NOT LIKE 'https%'
    ORDER BY blocknumber DESC LIMIT 1
  ) AS old_cover_art_sizes
  FROM tracks AS t1
  WHERE is_current = TRUE
    AND (
      cover_art_sizes LIKE 'blob%' 
      OR cover_art_sizes LIKE 'file%' 
      OR cover_art_sizes LIKE '/data/user/%'
      OR cover_art_sizes LIKE 'https%'
    )
)
UPDATE tracks
SET cover_art_sizes = cover_art_cte.old_cover_art_sizes
FROM cover_art_cte
WHERE tracks.track_id = cover_art_cte.track_id
  AND tracks.owner_Id = cover_art_cte.owner_Id
  AND tracks.is_current = TRUE;


-- Users
-- Profile picture
WITH profile_pic_cte AS (
  SELECT user_id, profile_picture_sizes, (
    SELECT
      profile_picture_sizes
    FROM users
    WHERE
      user_id = u1.user_id
      AND is_current = FALSE
      AND profile_picture_sizes NOT LIKE 'blob%' 
      AND profile_picture_sizes NOT LIKE 'file%'
      AND profile_picture_sizes NOT LIKE '/data/user/%'
      AND profile_picture_sizes NOT LIKE 'https%'
    ORDER BY blocknumber DESC LIMIT 1
  ) AS old_profile_picture_sizes
  FROM users AS u1
  WHERE is_current = TRUE
    AND (
      profile_picture_sizes LIKE 'blob%' 
      OR profile_picture_sizes LIKE 'file%' 
      OR profile_picture_sizes LIKE '/data/user/%'
      OR profile_picture_sizes LIKE 'https%'
    )
)
UPDATE users
SET profile_picture_sizes = profile_pic_cte.profile_picture_sizes
FROM profile_pic_cte
WHERE users.user_id = profile_pic_cte.user_id
  AND users.is_current = TRUE;

-- Cover photo
WITH cover_photo_cte AS (
  SELECT user_id, cover_photo_sizes, (
    SELECT
      cover_photo_sizes
    FROM users
    WHERE
      user_id = u1.user_id
      AND is_current = FALSE
      AND cover_photo_sizes NOT LIKE 'blob%' 
      AND cover_photo_sizes NOT LIKE 'file%'
      AND cover_photo_sizes NOT LIKE '/data/user/%'
      AND cover_photo_sizes NOT LIKE 'https%'
    ORDER BY blocknumber DESC LIMIT 1
  ) AS old_cover_photo_sizes
  FROM users AS u1
  WHERE is_current = TRUE
    AND (
      cover_photo_sizes LIKE 'blob%' 
      OR cover_photo_sizes LIKE 'file%' 
      OR cover_photo_sizes LIKE '/data/user/%'
      OR cover_photo_sizes LIKE 'https%'
    )
)
UPDATE users
SET cover_photo_sizes = cover_photo_cte.cover_photo_sizes
FROM cover_photo_cte
WHERE users.user_id = cover_photo_cte.user_id
  AND users.is_current = TRUE;


-- Playlists
WITH cover_art_cte AS (
  SELECT playlist_id, playlist_owner_id, playlist_image_sizes_multihash, (
    SELECT
      playlist_image_sizes_multihash
    FROM playlists
    WHERE
      playlist_id = p1.playlist_id
      AND is_current = FALSE
      AND playlist_image_sizes_multihash NOT LIKE 'blob%' 
      AND playlist_image_sizes_multihash NOT LIKE 'file%'
      AND playlist_image_sizes_multihash NOT LIKE '/data/user/%'
      AND playlist_image_sizes_multihash NOT LIKE 'https%'
    ORDER BY blocknumber DESC LIMIT 1
  ) AS old_playlist_image_sizes_multihash
  FROM playlists AS p1
  WHERE is_current = TRUE
    AND (
      playlist_image_sizes_multihash LIKE 'blob%' 
      OR playlist_image_sizes_multihash LIKE 'file%' 
      OR playlist_image_sizes_multihash LIKE '/data/user/%'
      OR playlist_image_sizes_multihash LIKE 'https%'
    )
)
UPDATE playlists
SET playlist_image_sizes_multihash = cover_art_cte.playlist_image_sizes_multihash
FROM cover_art_cte
WHERE playlists.playlist_id = cover_art_cte.playlist_id
  AND playlists.playlist_owner_Id = cover_art_cte.playlist_owner_Id
  AND playlists.is_current = TRUE;


COMMIT;