-- migrate:up
create table user_pubkey (
  user_id int primary key,
  pubkey_base64 text not null
)

-- migrate:down
drop table if exists user_pubkey cascade;
