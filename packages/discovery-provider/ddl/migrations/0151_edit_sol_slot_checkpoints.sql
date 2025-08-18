DROP TABLE IF EXISTS sol_slot_checkpoint;
CREATE TABLE IF NOT EXISTS sol_slot_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_slot BIGINT NOT NULL,
    to_slot BIGINT NOT NULL,
    subscription_hash TEXT NOT NULL,
    subscription JSONB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS sol_slot_checkpoints_to_slot_idx ON sol_slot_checkpoints (subscription_hash, to_slot);
CREATE INDEX IF NOT EXISTS sol_slot_checkpoints_from_slot_idx ON sol_slot_checkpoints (subscription_hash, from_slot);
COMMENT ON TABLE sol_slot_checkpoints IS 'Stores checkpoints for Solana slots to track indexing progress.';
