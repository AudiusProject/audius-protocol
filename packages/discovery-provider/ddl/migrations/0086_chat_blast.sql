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

-- make chat_member.invite_code nullable
-- this will require some client changes to generate this when missing
-- and API change to accept an invite_code for an existing chat.
alter table chat_member alter column invite_code drop not null;

commit;
