BEGIN;

-- remixes
create index if not exists remixes_child_idx on remixes(child_track_id, parent_track_id);


-- repost user + date
-- good for feed
drop index if exists reposts_new_user_id_repost_type_idx;
create index if not exists reposts_user_idx on reposts(user_id, repost_type, repost_item_id, created_at, is_delete);

drop index if exists reposts_new_repost_item_id_repost_type_idx;
create index if not exists reposts_item_idx on reposts(repost_item_id, repost_type, user_id, is_delete);


-- saves
drop index if exists saves_new_user_id_save_type_idx;
create index if not exists saves_user_idx on saves(user_id, save_type, save_item_id, created_at, is_delete);

drop index if exists saves_new_save_item_id_save_type_idx;
create index if not exists saves_item_idx on saves(save_item_id, save_type, user_id, is_delete);


-- tracks owner + date
-- good for feed
drop index if exists tracks_owner_idx;
create index if not exists track_owner_idx on tracks(owner_id, created_at);

-- playlist owner + date
-- good for feed
drop index if exists playlist_owner_id_idx;
create index if not exists playlist_owner_idx on playlists(playlist_owner_id, created_at);

COMMIT;
