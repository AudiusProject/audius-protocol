-- drop slot and tx_signature column in reactions table
begin;

lock table reactions in exclusive mode;

-- drop unused and legacy columns
alter table reactions drop column if exists slot;
alter table reactions drop column if exists tx_signature;

-- add default block number
alter table reactions add column blocknumber integer;

-- cascade delete on block revert
alter table reactions drop constraint if exists reactions_blocknumber_fkey;
alter table reactions add constraint reactions_blocknumber_fkey foreign key (blocknumber) references blocks(number) on delete cascade; 

commit;
