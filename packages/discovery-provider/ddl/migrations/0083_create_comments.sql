begin;

CREATE TABLE IF NOT EXISTS comments (
    comment_id PRIMARY KEY,
    text TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    track_timestamp_ms BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_delete BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    txhash varchar NOT NULL,
    blockhash varchar NOT NULL,
    blocknumber INTEGER NOT NULL
);


commit;
