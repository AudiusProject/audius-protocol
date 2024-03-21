begin; do $$
declare

begin

    insert into users
        (user_id, is_current, created_at, updated_at, is_verified, has_collectibles, txhash, is_deactivated, is_available, is_storage_v2, allow_ai_attribution, handle_lc)
    values
        (44, true, now(), now(), false, false, '0x123', false, false, true, true, 'someuser');

    insert into track_routes
    values
        ('a-track', 'a-track', 0, 44, 55, true, '0xBlockHash', 123, '0xTxHash');


    -- user_id + track_id
    assert (select find_track('someuser/a-track')) = (44, 55);

    -- also works with fqdn
    assert (select find_track('https://audius.co/someuser/a-track')) = (44, 55);

    -- user without track still returns user_id
    assert (select find_track('someuser/b-track')) = (44, null::integer);

    -- no match
    assert (select find_track('nouser/b-track')) = (null::integer, null::integer);


end; $$ LANGUAGE plpgsql;
rollback;
