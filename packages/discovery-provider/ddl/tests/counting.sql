begin; do $$
declare
    agg_user aggregate_user%rowtype := null;
    agg_track aggregate_track%rowtype := null;

begin

    INSERT INTO "blocks"
    ("blockhash", "parenthash", "number", "is_current")
    VALUES
    (
        '0x0',
        NULL,
        0,
        TRUE
    )
    on conflict do nothing;

    insert into follows
        (follower_user_id, followee_user_id, is_current, is_delete, created_at)
    values
        (1, 2, true, false, now());

    insert into reposts
        (user_id, repost_type, repost_item_id, is_current, is_delete, created_at)
    values
        (1, 'track', 101, true, false, now());


    INSERT INTO tracks
		(
			blockhash,
			track_id,
			is_current,
			is_delete,
			owner_id,
			title,
			cover_art,
			tags,
			genre,
			mood,
			credits_splits,
			create_date,
			file_type,
			metadata_multihash,
			blocknumber,
			created_at,
			description,
			isrc,
			iswc,
			license,
			updated_at,
			cover_art_sizes,
			is_unlisted,
			field_visibility,
			route_id,
			stem_of,
			remix_of,
			txhash,
			slot,
			is_available,
			is_stream_gated,
			stream_conditions,
			track_cid,
			is_playlist_upload,
			duration,
			ai_attribution_user_id,
			preview_cid,
			audio_upload_id,
			preview_start_seconds,
			release_date,
			track_segments,
			is_scheduled_release,
			is_downloadable,
			is_download_gated,
			download_conditions,
			is_original_available,
			orig_file_cid,
			orig_filename,
			playlists_containing_track,
			placement_hosts,
			ddex_app,
			ddex_release_ids,
			artists,
			resource_contributors,
			indirect_resource_contributors,
			rights_controller,
			copyright_line,
			producer_copyright_line,
			parental_warning_type,
			playlists_previously_containing_track
		)
VALUES
	(
		'0xd85318473928bbfc3d499579294cbe58d41cd1e9f1f68c2e82a1af169eda2522',
		102,
		true,
		false,
		1,
		'file',
		NULL,
		'',
		'Electronic',
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		0,  -- blockno
		'2023-10-26 17:35:56',
		'',
		'',
		'',
		NULL,
		'2023-10-26 17:35:56',
		'01HDPGWRJNN4DACZB4ZVF15SNA',
		true, -- is_unlisted
		'{"mood": true, "tags": true, "genre": true, "share": false, "remixes": true, "play_count": false}',
		'isaacsolo/file',
		NULL,
		NULL,
		'0xdbe9867fe09453fa87647c7fb98d4f4ca814857ee9ec93f03b603c0a399c64d7',
		NULL,
		true,
		false,
		NULL,
		'baeaaaiqseduy36z5dameji7e4pu2obbdlvhdgaii7dhvv7ulqwk6l2zfjhpyu',
		false,
		3,
		NULL,
		NULL,
		'01HDPGWRGX75Z67EN9THMS4RK2',
		NULL,
		'2023-10-26 12:00:00',
		'[]',
		false,
		false,
		false,
		NULL,
		false,
		'baeaaaiqseduy36z5dameji7e4pu2obbdlvhdgaii7dhvv7ulqwk6l2zfjhpyu',
		'file - [Isaac Solo].mp3',
		'{}',
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		'{}'
	);


    assert (select count(*) from aggregate_user) = 2;
    assert (select count(*) from aggregate_track) = 2;

    select * from aggregate_user into agg_user where user_id = 1;
    assert agg_user.track_count = 0;
    assert agg_user.follower_count = 0;
    assert agg_user.following_count = 1;
    assert agg_user.repost_count = 1;

    select * from aggregate_user into agg_user where user_id = 2;
    assert agg_user.follower_count = 1;
    assert agg_user.following_count = 0;
    assert agg_user.repost_count = 0;

    select * from aggregate_track into agg_track where track_id = 101;
    assert agg_track.repost_count = 1;

    -- publish_scheduled_release actually issues an update
    -- BUT clicking the publish button... will actually delete the old one and insert a new one...
    -- so, this test doesn't actually exercise the "publish button" bug
    update tracks set is_unlisted = false where track_id = 102;
    select * from aggregate_user into agg_user where user_id = 1;
    assert agg_user.track_count = 1;

end; $$ LANGUAGE plpgsql;
rollback;
