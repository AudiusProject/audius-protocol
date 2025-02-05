begin;

create table if not exists collectibles_data (
    user_id INTEGER NOT NULL,
    data JSONB NOT NULL,
    blockhash TEXT NOT NULL,
    blocknumber INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT pk_user_id PRIMARY KEY (user_id),
    FOREIGN KEY (blocknumber) REFERENCES blocks(number) ON DELETE CASCADE
);

COMMENT ON TABLE collectibles_data IS 'Stores collectibles data for users';
COMMENT ON COLUMN collectibles_data.user_id IS 'User ID of the person who owns the collectibles';
COMMENT ON COLUMN collectibles_data.data IS 'Data about the collectibles';
COMMENT ON COLUMN collectibles_data.blockhash IS 'Blockhash of the most recent block that changed the collectibles data';
COMMENT ON COLUMN collectibles_data.blocknumber IS 'Block number of the most recent block that changed the collectibles data';

INSERT INTO collectibles_data (user_id, data, blockhash, blocknumber)
SELECT
    u.user_id,
    cid.data->'collectibles' AS data,
    u.blockhash,
    u.blocknumber
FROM users u
LEFT JOIN cid_data cid ON u.metadata_multihash = cid.cid
WHERE u.has_collectibles = TRUE
ON CONFLICT (user_id) DO NOTHING;

commit;