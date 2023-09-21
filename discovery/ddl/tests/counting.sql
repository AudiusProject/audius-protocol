begin; do $$
declare
    agg_user aggregate_user%rowtype := null;
    agg_track aggregate_track%rowtype := null;

begin

    insert into follows
        (follower_user_id, followee_user_id, is_current, is_delete, created_at)
    values
        (1, 2, true, false, now());

    insert into reposts
        (user_id, repost_type, repost_item_id, is_current, is_delete, created_at)
    values
        (1, 'track', 101, true, false, now());


    assert (select count(*) from aggregate_user) = 2;
    assert (select count(*) from aggregate_track) = 1;

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
