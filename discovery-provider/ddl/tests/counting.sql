begin; do $$
declare
    agg_user aggregate_user%rowtype := null;
    agg_track aggregate_track%rowtype := null;

begin

    -- track
    insert into tracks
      (track_id, is_current, is_delete, owner_id, track_segments, created_at, updated_at, blocknumber)
    values
      (101, true, false, 2, '[]', now(), now(), 9000);

    -- playlist
    insert into playlists
      (playlist_id, playlist_owner_id, is_album, is_private, playlist_contents, is_current, is_delete, created_at, updated_at, blocknumber)
    values
      (201, 2, false, false, '[]', true, false, now(), now(), 9000);

    -- follow
    insert into follows
        (follower_user_id, followee_user_id, is_current, is_delete, created_at, blocknumber)
    values
        (1, 2, true, false, now(), 9001);

    -- repost track
    insert into reposts
        (user_id, repost_type, repost_item_id, is_current, is_delete, created_at, blocknumber)
    values
        (1, 'track', 101, true, false, now(), 9002);

    -- repost playlist
    insert into saves
        (user_id, save_type, save_item_id, is_current, is_delete, created_at, blocknumber)
    values
        (1, 'track', 101, true, false, now(), 9002);


    assert (select count(*) from aggregate_user) = 2;
    assert (select count(*) from aggregate_track) = 1;
    assert (select count(*) from action_log) = 5;

    select * from aggregate_user into agg_user where user_id = 1;
    assert agg_user.follower_count = 0;
    assert agg_user.following_count = 1;
    assert agg_user.repost_count = 1;

    select * from aggregate_user into agg_user where user_id = 2;
    assert agg_user.follower_count = 1;
    assert agg_user.following_count = 0;
    assert agg_user.repost_count = 0;

    select * from aggregate_track into agg_track where track_id = 101;
    assert agg_track.repost_count = 1;

end; $$ LANGUAGE plpgsql;
rollback;
