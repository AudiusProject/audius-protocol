begin;

create table if not exists chat_blast (
  blast_id text primary key,
  from_user_id int not null,
  audience text not null, -- todo sql enum I guess?
  audience_track_id int, -- if scoped to a specific remix / purchase
  plaintext text not null,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- make ciphertext nullable
alter table chat_message alter column ciphertext drop not null;

-- add optional fk to chat_blast
alter table chat_message add column if not exists blast_id text references chat_blast(blast_id);

commit;
