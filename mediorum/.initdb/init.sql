-- Only called through `make` - not used by audius-compose and not compatible with audius-compose
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


create database m1 WITH TEMPLATE postgres;
create database m2 WITH TEMPLATE postgres;
create database m3 WITH TEMPLATE postgres;
create database m4 WITH TEMPLATE postgres;
create database m5 WITH TEMPLATE postgres;
create database m6 WITH TEMPLATE postgres;
create database m7 WITH TEMPLATE postgres;
create database m8 WITH TEMPLATE postgres;
create database m9 WITH TEMPLATE postgres;
create database mediorum_test WITH TEMPLATE postgres;
