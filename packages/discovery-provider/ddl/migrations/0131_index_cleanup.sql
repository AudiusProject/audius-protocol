BEGIN;

-- user index cleanup
drop index if exists users_new_is_available_idx;
drop index if exists users_new_is_deactivated_handle_lc_is_available_idx;
drop index if exists users_new_is_deactivated_idx;
create index if not exists idx_user_status on users(user_id, is_deactivated, is_available, is_current);

-- track index cleanup
drop index if exists fix_tracks_status_flags_idx;
create index if not exists idx_track_status on tracks(track_id, is_unlisted, is_available, is_delete, is_current);

-- playlist index
create index if not exists idx_playlist_status on playlists(playlist_id, is_album, is_private, is_delete, is_current);

COMMIT;
