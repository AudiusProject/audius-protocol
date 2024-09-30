begin;

CREATE TABLE IF NOT EXISTS comment_mentions (
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_delete BOOLEAN DEFAULT FALSE,
    txhash TEXT NOT NULL,
    blockhash TEXT NOT NULL,
    blocknumber INTEGER REFERENCES blocks (number) ON DELETE CASCADE,
    PRIMARY KEY (comment_id, user_id)
);

commit;