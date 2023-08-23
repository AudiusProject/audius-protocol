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
    dupes as (
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
update reposts
set is_current = false
where (repost_item_id, user_id, blocknumber) in (
    select 
        d.repost_item_id,
        d.user_id,
        r.blocknumber
    from dupes d
    join reposts r 
    on d.repost_item_id = r.repost_item_id 
    and d.user_id = r.user_id 
    and r.blocknumber < d.max_blocknumber
    where r.is_current = true
);



with
    dupes as (
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
update saves
set is_current = false
where (save_item_id, user_id, blocknumber) in (
    select 
        d.save_item_id,
        d.user_id,
        r.blocknumber
    from dupes d
    join saves r 
    on d.save_item_id = r.save_item_id 
    and d.user_id = r.user_id 
    and r.blocknumber < d.max_blocknumber
    where r.is_current = true
);

commit;