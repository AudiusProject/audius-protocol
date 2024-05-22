begin;

-- drop the existing foreign key constraint
alter table album_price_history drop constraint if exists blocknumber_fkey;
alter table album_price_history drop constraint if exists album_price_history_blocknumber_fkey;

-- add the foreign key constraint with on delete cascade
alter table album_price_history
add constraint album_price_history_blocknumber_fkey foreign key (blocknumber)
references blocks(number) on delete cascade;

commit;