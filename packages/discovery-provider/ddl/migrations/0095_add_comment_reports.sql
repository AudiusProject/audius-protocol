begin;

CREATE TABLE IF NOT EXISTS comment_reports (
    comment_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_delete BOOLEAN DEFAULT FALSE,
    txhash TEXT NOT NULL,
    blockhash TEXT NOT NULL,
    blocknumber integer REFERENCES blocks (number) ON DELETE CASCADE
);

commit;