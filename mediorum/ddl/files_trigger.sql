
-- cid_log tracks inserts and deletes on the local Files table
create table if not exists cid_log (
    multihash text primary key,
    is_deleted boolean default false,
    updated_at timestamp with time zone NOT NULL
);

-- initial backfill
insert into cid_log (multihash, updated_at)
  select distinct "multihash", "createdAt" from "Files"
  union
  select distinct "dirMultihash", "createdAt" from "Files" where "dirMultihash" is not null
  on conflict do nothing;

create index if not exists idx_cid_log_updated_at on cid_log(updated_at);

-- trigger code
create or replace function handle_cid_change() returns trigger as $$
declare
begin

    case tg_op
    when 'DELETE' then
        update cid_log set is_deleted = true, updated_at = now() where multihash = old.multihash;
        update cid_log set is_deleted = true, updated_at = now() where multihash = old."dirMultihash";
    else
        insert into cid_log (multihash, updated_at) values (new.multihash, new."createdAt")
          on conflict do nothing;
        if new."dirMultihash" is not null then
          insert into cid_log (multihash, updated_at) values (new."dirMultihash", new."createdAt")
            on conflict do nothing;
        end if;
    end case;
    return null;

end;
$$ language plpgsql;

-- trigger
begin;
  drop trigger if exists handle_cid_change on "Files";
  create trigger handle_cid_change
      after insert or delete on "Files"
      for each row execute procedure handle_cid_change();
commit;

