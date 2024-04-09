-- On 2024-03-26 a change introduced a bug on the client that caused tracks
-- uploaded in part of collections to not inherit their collection's cover art.
WITH images as (
    SELECT
        tracks.track_id,
        playlists.playlist_image_multihash,
        playlists.playlist_image_sizes_multihash
    FROM
        tracks
        JOIN playlists ON playlists.playlist_id = tracks.playlists_containing_track [1]
    WHERE
        tracks.created_at > '2024-03-26'
        AND tracks.created_at < '2024-04-07'
        AND tracks.cover_art_sizes IS NULL
        AND tracks.cover_art IS NULL
        AND tracks.playlists_containing_track != '{}'
        AND tracks.stem_of IS NULL
)
UPDATE
    tracks
SET
    cover_art = images.playlist_image_multihash,
    cover_art_sizes = images.playlist_image_sizes_multihash
FROM
    images
WHERE
    tracks.track_id = images.track_id;