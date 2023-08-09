begin;

-- only use repost type playlist / track
update saves
set
    save_type = 'playlist'
where
    save_type = 'album'
    and (
        is_current = false
        or is_current = true
    );

update reposts
set
    repost_type = 'playlist'
where
    repost_type = 'album'
    and (
        is_current = false
        or is_current = true
    );
-- remove dupes
-- pick most recent row with is_current and delete others 
with
    max_blocknumbers as (
        select
            *
        from
            (
                select
                    repost_item_id,
                    user_id,
                    repost_type,
                    max(blocknumber) as max_blocknumber,
                    count(*) as current_count
                from
                    reposts
                where
                    is_current = true
                group by
                    repost_item_id,
                    user_id,
                    repost_type
            ) a
        where
            a.current_count > 1
    )
delete from reposts using max_blocknumbers
where
    reposts.repost_item_id = max_blocknumbers.repost_item_id
    and reposts.user_id = max_blocknumbers.user_id
    and reposts.repost_type = max_blocknumbers.repost_type
    and reposts.blocknumber < max_blocknumbers.max_blocknumber;

with
    max_blocknumbers as (
        select
            *
        from
            (
                select
                    save_item_id,
                    user_id,
                    save_type,
                    max(blocknumber) as max_blocknumber,
                    count(*) as current_count
                from
                    saves
                where
                    is_current = true
                group by
                    save_item_id,
                    user_id,
                    save_type
            ) a
        where
            a.current_count > 1
    )
delete from saves using max_blocknumbers
where
    saves.save_item_id = max_blocknumbers.save_item_id
    and saves.user_id = max_blocknumbers.user_id
    and saves.save_type = max_blocknumbers.save_type
    and saves.blocknumber < max_blocknumbers.max_blocknumber;


commit;