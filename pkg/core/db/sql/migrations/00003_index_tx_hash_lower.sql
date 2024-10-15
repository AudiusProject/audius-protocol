-- +migrate Up
CREATE INDEX idx_core_tx_results_tx_hash_lower ON core_tx_results (LOWER(tx_hash));

-- +migrate Down
drop index if exists idx_core_tx_results_tx_hash_lower;
