create index if not exists rpc_log_applied_at_idx on rpc_log using brin(applied_at);
