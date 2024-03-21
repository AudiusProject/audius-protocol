CREATE TABLE IF NOT EXISTS album_price_history (
	playlist_id integer NOT NULL,
	splits JSONB NOT NULL, -- Represents amounts per each Solana account
	total_price_cents bigint NOT NULL,
	blocknumber integer NOT NULL,
	block_timestamp timestamp WITHOUT TIME ZONE NOT NULL,
    created_at timestamp WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (playlist_id, block_timestamp),
    CONSTRAINT blocknumber_fkey FOREIGN KEY (blocknumber) REFERENCES blocks("number")
);
