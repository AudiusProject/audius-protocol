-- drop slot and tx_signature column in reactions table
begin;

lock table reactions in exclusive mode;

alter table reactions drop column if exists slot;
alter table reactions drop column if exists tx_signature;

commit;
