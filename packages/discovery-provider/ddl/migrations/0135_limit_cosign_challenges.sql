-- applying retroactive removal of cosign limiting
-- a verified artist can only cosign reward 5 tracks per week
with actions as (
    select user_id,
        save_item_id as item_id,
        created_at
    from saves
    where created_at >= '2025-04-08 17:26:30+00'
        and saves.save_type = 'track'
    union all
    select user_id,
        repost_item_id as item_id,
        created_at
    from reposts
    where created_at >= '2025-04-08 17:26:30+00'
        and reposts.repost_type = 'track'
),
verified_actions as (
    select a.*,
        row_number() over (
            partition by a.user_id
            order by a.created_at
        ) as rn
    from actions a
        join users u on a.user_id = u.user_id
    where u.is_verified
),
allowed_challenges as (
    select uc.challenge_id,
        uc.user_id,
        uc.specifier
    from verified_actions va
        join user_challenges uc on uc.specifier = to_hex(va.item_id)
    where va.rn <= 5
)
delete from user_challenges uc
where uc.challenge_id = 'cs'
    and not exists (
        select 1
        from allowed_challenges ac
        where ac.user_id = uc.user_id
            and ac.specifier = uc.specifier
    );