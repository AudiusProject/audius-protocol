begin;

CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY,
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
    txhash TEXT NOT NULL,
    blockhash TEXT NOT NULL,
    blocknumber integer REFERENCES blocks(number) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_threads (
    comment_id INTEGER, 
    parent_comment_id INTEGER,
    CONSTRAINT comment_threads_pkey PRIMARY KEY (parent_comment_id, comment_id)
);



commit;
