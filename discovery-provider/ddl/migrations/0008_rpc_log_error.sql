begin;

create table if not exists rpc_error (
  sig text primary key,
  rpc_log_json jsonb not null,
  error_text text not null,
  error_count int not null default 0,
  last_attempt timestamp without time zone not null
);

commit;
