-- add this fkey constraint to cascade delete track_price_history on revert
begin;
alter table track_price_history add constraint track_price_history_blocknumber_fkey foreign key (blocknumber) references blocks (number) on delete cascade;
commit;
