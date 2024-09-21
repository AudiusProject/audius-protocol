begin;

alter table comment_threads
add column if not exists created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

alter table comment_threads
add column if not exists updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

alter table comment_threads
add column if not exists txhash TEXT NOT NULL;

alter table comment_threads
add column if not exists blockhash TEXT NOT NULL;

alter table comment_threads
add column if not exists blocknumber integer REFERENCES blocks (number) ON DELETE CASCADE;

commit;