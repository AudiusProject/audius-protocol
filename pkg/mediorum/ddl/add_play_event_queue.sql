begin;

create table if not exists play_event_queue(
  rowid serial primary key,
  user_id text not null,
  track_id text not null,
  play_time timestamp not null,
  signature text not null,
  city text not null,
  region text not null,
  country text not null
);

commit;
