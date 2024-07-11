CREATE TABLE IF NOT EXISTS track_downloads (
    txhash VARCHAR NOT NULL,
    blocknumber INTEGER NOT NULL,
    parent_track_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    user_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT track_downloads_blocknumber_fkey FOREIGN KEY (blocknumber) REFERENCES blocks("number") ON DELETE CASCADE,
    PRIMARY KEY(
        parent_track_id,
        track_id,
        txhash
    )
);