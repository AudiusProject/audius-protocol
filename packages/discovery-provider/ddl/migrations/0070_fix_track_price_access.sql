UPDATE track_price_history
SET access = 'download'
WHERE track_id IN (
    SELECT tp.track_id
    FROM track_price_history tp
    JOIN tracks t ON t.track_id = tp.track_id
    WHERE tp.access = 'stream'
    AND t.is_stream_gated = false
    AND t.is_download_gated = true
);
