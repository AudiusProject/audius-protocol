begin;

-- cid_lookup is the main table used to determine which host has a given CID
-- multihash column is used for both multihash and dirMultihash
create table if not exists cid_lookup (
    "multihash" text,
    "host" text
);

-- creator-node creates the Files table, but we need to create it here in case we're running via audius-compose without CNs
CREATE TABLE if not exists "Files" (
    multihash text NOT NULL,
    "sourceFile" text,
    "storagePath" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fileUUID" uuid NOT NULL,
    "cnodeUserUUID" uuid,
    type character varying(16),
    "fileName" text,
    "dirMultihash" text,
    "trackBlockchainId" integer,
    clock integer NOT NULL,
    skipped boolean DEFAULT false NOT NULL
);

create unique index if not exists "idx_multihash" on cid_lookup("multihash", "host");


-- cid_log tracks inserts and deletes on the local Files table
-- so that peers can get recent changes when updating their cid_lookup table.
create table if not exists cid_log (
    multihash text primary key,
    is_deleted boolean default false,
    updated_at timestamp with time zone NOT NULL
);

-- cid_cursor tracks the last timestamp so we can consume only new entries cid_log
-- for a given peer
create table if not exists cid_cursor (
    "host" text primary key,
    "updated_at" timestamp with time zone NOT NULL
);


-- initial backfill
-- this sql file runs on boot every time
-- but this backfill is expensive
-- and the index idx_cid_log_updated_at is created after the backfill runs
-- so use the presence of idx_cid_log_updated_at to not re-run this.
do $$
declare
  has_index bool := false;
begin
  select count(*) = 1 into has_index from pg_indexes where indexname = 'idx_cid_log_updated_at';
  if not has_index then

    -- backfill multihash
    insert into cid_log (multihash, updated_at)
      select "multihash", "createdAt" from "Files"
        on conflict do nothing;

    -- backfill dirMultihash
    insert into cid_log (multihash, updated_at)
      select "dirMultihash", "createdAt" from "Files" where "dirMultihash" is not null
        on conflict do nothing;

  end if;
end; $$;

create index if not exists idx_cid_log_updated_at on cid_log(updated_at);

-- trigger code: creates a cid_log entry when a File is created or deleted
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

-- trigger trigger
drop trigger if exists handle_cid_change on "Files";
create trigger handle_cid_change
    after insert or delete on "Files"
    for each row execute procedure handle_cid_change();

commit;
