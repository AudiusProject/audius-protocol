-- dedupe album reposts and saves
-- keep the record with the most recent blocknumber
begin;

with cte as (
    select
        user_id,
        repost_item_id,
        repost_type,
        blocknumber,
        row_number() over (
            partition by user_id,
            repost_item_id,
            repost_type
            order by
                blocknumber desc
        ) as rn
    from
        reposts
)
delete from
    reposts
where
    (
        user_id,
        repost_item_id,
        repost_type,
        blocknumber
    ) in (
        select
            user_id,
            repost_item_id,
            repost_type,
            blocknumber
        from
            cte
        where
            rn > 1
    );

with cte as (
    select
        user_id,
        save_item_id,
        save_type,
        blocknumber,
        row_number() over (
            partition by user_id,
            save_item_id,
            save_type
            order by
                blocknumber desc
        ) as rn
    from
        saves
)
delete from
    saves
where
    (user_id, save_item_id, save_type, blocknumber) in (
        select
            user_id,
            save_item_id,
            save_type,
            blocknumber
        from
            cte
        where
            rn > 1
    );

commit;