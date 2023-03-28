-- migrate:up
update rpc_log set applied_at = relayed_at where applied_at is null;

alter table rpc_log alter column applied_at set not null;

-- migrate:down

