BEGIN TRANSACTION;

-- Update track stream price history
WITH updated_track_stream_splits AS (
    SELECT
        track_id,
        stream_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object('user_id', owner_id, 'percentage', 100.0000)
        ) as splits
    FROM
        tracks
    WHERE
        jsonb_typeof(stream_conditions -> 'usdc_purchase' -> 'splits') = 'object'
)
UPDATE
    track_price_history
SET
    splits = updated_track_stream_splits.splits
FROM
    updated_track_stream_splits
WHERE
    updated_track_stream_splits.track_id = track_price_history.track_id
    AND track_price_history.access = 'stream';

-- Update track stream conditions
WITH updated_track_stream_splits AS (
    SELECT
        track_id,
        stream_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object('user_id', owner_id, 'percentage', 100.0000)
        ) as splits
    FROM
        tracks
    WHERE
        jsonb_typeof(stream_conditions -> 'usdc_purchase' -> 'splits') = 'object'
)
UPDATE
    tracks
SET
    stream_conditions = jsonb_build_object(
        'usdc_purchase',
        jsonb_build_object(
            'price',
            updated_track_stream_splits.price,
            'splits',
            updated_track_stream_splits.splits
        )
    )
FROM
    updated_track_stream_splits
WHERE
    updated_track_stream_splits.track_id = tracks.track_id;

-- Update track download price history
WITH updated_track_download_splits AS (
    SELECT
        track_id,
        download_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object('user_id', owner_id, 'percentage', 100.0000)
        ) as splits
    FROM
        tracks
    WHERE
        jsonb_typeof(
            download_conditions -> 'usdc_purchase' -> 'splits'
        ) = 'object'
)
UPDATE
    track_price_history
SET
    splits = updated_track_download_splits.splits
FROM
    updated_track_download_splits
WHERE
    updated_track_download_splits.track_id = track_price_history.track_id
    AND track_price_history.access = 'download';

-- Update track download conditions
WITH updated_track_download_splits AS (
    SELECT
        track_id,
        download_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object('user_id', owner_id, 'percentage', 100.0000)
        ) as splits
    FROM
        tracks
    WHERE
        jsonb_typeof(
            download_conditions -> 'usdc_purchase' -> 'splits'
        ) = 'object'
)
UPDATE
    tracks
SET
    download_conditions = jsonb_build_object(
        'usdc_purchase',
        jsonb_build_object(
            'price',
            updated_track_download_splits.price,
            'splits',
            updated_track_download_splits.splits
        )
    )
FROM
    updated_track_download_splits
WHERE
    updated_track_download_splits.track_id = tracks.track_id;

-- Update album price history
WITH updated_album_stream_splits AS (
    SELECT
        playlist_id,
        stream_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object(
                'user_id',
                playlist_owner_id,
                'percentage',
                100.0000
            )
        ) as splits
    FROM
        playlists
    WHERE
        jsonb_typeof(stream_conditions -> 'usdc_purchase' -> 'splits') = 'object'
)
UPDATE
    album_price_history
SET
    splits = updated_album_stream_splits.splits
FROM
    updated_album_stream_splits
WHERE
    updated_album_stream_splits.playlist_id = album_price_history.playlist_id;

-- Update album stream conditions
WITH updated_album_stream_splits AS (
    SELECT
        playlist_id,
        stream_conditions -> 'usdc_purchase' -> 'price' AS price,
        jsonb_build_array(
            jsonb_build_object(
                'user_id',
                playlist_owner_id,
                'percentage',
                100.0000
            )
        ) as splits
    FROM
        playlists
    WHERE
        jsonb_typeof(stream_conditions -> 'usdc_purchase' -> 'splits') = 'object'
)
UPDATE
    playlists
SET
    stream_conditions = jsonb_build_object(
        'usdc_purchase',
        jsonb_build_object(
            'price',
            updated_album_stream_splits.price,
            'splits',
            updated_album_stream_splits.splits
        )
    )
FROM
    updated_album_stream_splits
WHERE
    updated_album_stream_splits.playlist_id = playlists.playlist_id;

COMMIT;