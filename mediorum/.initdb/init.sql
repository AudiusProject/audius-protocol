-- Only called through `make` - not used by audius-compose and not compatible with audius-compose
CREATE TABLE IF NOT EXISTS "Files" (
  multihash text NOT NULL,
  "dirMultihash" text,
  "type" text,
  "createdAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone NOT NULL
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
