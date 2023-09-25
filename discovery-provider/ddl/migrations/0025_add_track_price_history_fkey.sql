-- add this fkey constraint to cascade delete track_price_history on revert
begin;

do $$
begin
   if not exists (select 1 from pg_constraint where conname = 'track_price_history_blocknumber_fkey') then
    alter table track_price_history add constraint track_price_history_blocknumber_fkey foreign key (blocknumber) references blocks (number) on delete cascade;
  end if;

end $$;

commit;
