begin;

CREATE INDEX if not exists idx_lower_wallet ON users (LOWER(wallet));

commit;
