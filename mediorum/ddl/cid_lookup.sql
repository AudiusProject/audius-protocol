begin;


-- creator-node creates the Files table, but we need to create it here in case we're running via audius-compose without CNs
CREATE TABLE IF NOT EXISTS "Files" (
    "id" SERIAL PRIMARY KEY,
    "ownerId" INTEGER NOT NULL,
    "multihash" text NOT NULL,
    "sourceFile" text,
    "storagePath" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fileUUID" uuid NOT NULL UNIQUE,
    "cnodeUserUUID" uuid,
    "type" character varying(16),
    "fileName" text,
    "dirMultihash" text,
    -- "trackBlockchainId" integer, -- this is part of the table, but CN migration sets it and breaks if it already exists. initdb/init.sql will create it if running without CNs
    "clock" integer NOT NULL,
    "skipped" boolean DEFAULT false NOT NULL
);



-- cid_lookup is the main table used to determine which host has a given CID
-- multihash column is used for both multihash and dirMultihash
create table if not exists cid_lookup (
    "multihash" text,
    "host" text
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

-- backfill multihash
insert into cid_log (multihash, updated_at)
  select "multihash", "createdAt" from "Files"
    where "type" != 'track'
      on conflict do nothing;

-- backfill dirMultihash
insert into cid_log (multihash, updated_at)
  select "dirMultihash", "createdAt" from "Files" where "dirMultihash" is not null
    on conflict do nothing;


create index if not exists idx_cid_log_updated_at on cid_log(updated_at);

-- trigger code: creates a cid_log entry when a File is created or deleted
create or replace function handle_cid_change() returns trigger as $$
declare
begin

    if new."type" = 'track' or old."type" = 'track' then
      return null;
    end if;

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
