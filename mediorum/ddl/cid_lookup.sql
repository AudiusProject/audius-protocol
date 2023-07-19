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


-- cid_lookup is replaced by cuckoo filter
drop trigger if exists handle_cid_change on "Files";
drop function if exists handle_cid_change;

drop table if exists cid_lookup cascade;
drop table if exists cid_log cascade;
drop table if exists cid_cursor cascade;
