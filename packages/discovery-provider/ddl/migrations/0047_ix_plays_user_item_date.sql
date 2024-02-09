begin;
lock table plays in access exclusive mode;

create index if not exists ix_plays_user_track_date on plays(user_id, play_item_id, created_at) where user_id is not null;

commit;
