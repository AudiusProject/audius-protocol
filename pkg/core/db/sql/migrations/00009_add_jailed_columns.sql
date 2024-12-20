-- +migrate Up
alter table core_validators add column jailed boolean default false, add column jailed_until bigint default 0;

-- +migrate Down
alter table core_validators drop column jailed, drop column jailed_until;
