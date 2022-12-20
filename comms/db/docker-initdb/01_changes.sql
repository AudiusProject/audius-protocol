\connect audius_discovery

alter table users drop constraint users_blockhash_fkey;
alter table users drop constraint users_blocknumber_fkey;

alter table tracks drop constraint tracks_blockhash_fkey;
alter table tracks drop constraint tracks_blocknumber_fkey;
