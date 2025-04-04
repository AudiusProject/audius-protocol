create or replace function get_user_scores(
        target_user_ids integer [] default null::integer []
    ) returns table(
        user_id integer,
        handle_lc text,
        play_count bigint,
        follower_count bigint,
        challenge_count bigint,
        following_count bigint,
        chat_block_count bigint,
        score bigint
    ) language sql as $function$ with play_activity as (
        select plays.user_id,
            count(distinct date_trunc('minute', plays.created_at)) as play_count
        from plays
            join users on plays.user_id = users.user_id
        where target_user_ids is null
            or plays.user_id = any(target_user_ids)
        group by plays.user_id
    ),
    fast_challenge_completion as (
        select users.user_id,
            handle_lc,
            users.created_at,
            count(*) as challenge_count,
            array_agg(user_challenges.challenge_id) as challenge_ids
        from users
            left join user_challenges on users.user_id = user_challenges.user_id
        where user_challenges.is_complete
            and user_challenges.completed_at - users.created_at <= interval '3 minutes'
            and user_challenges.challenge_id not in ('m', 'b')
            and (
                target_user_ids is null
                or users.user_id = any(target_user_ids)
            )
        group by users.user_id,
            users.handle_lc,
            users.created_at
    ),
    chat_blocks as (
        select chat_blocked_users.blockee_user_id as user_id,
            count(*) as block_count
        from chat_blocked_users
            join users on chat_blocked_users.blockee_user_id = users.user_id
        where target_user_ids is null
            or chat_blocked_users.blockee_user_id = any(target_user_ids)
        group by chat_blocked_users.blockee_user_id
    ),
    aggregate_scores as (
        select users.user_id,
            users.handle_lc,
            users.created_at,
            case
                when (
                    users.handle_lc ilike '%audius%'
                    or lower(users.name) ilike '%audius%'
                )
                and users.is_verified = false then true
                else false
            end as audius_impersonator,
            coalesce(play_activity.play_count, 0) as play_count,
            coalesce(fast_challenge_completion.challenge_count, 0) as challenge_count,
            coalesce(aggregate_user.following_count, 0) as following_count,
            coalesce(aggregate_user.follower_count, 0) as follower_count,
            coalesce(chat_blocks.block_count, 0) as chat_block_count
        from users
            left join play_activity on users.user_id = play_activity.user_id
            left join fast_challenge_completion on users.user_id = fast_challenge_completion.user_id
            left join chat_blocks on users.user_id = chat_blocks.user_id
            left join aggregate_user on aggregate_user.user_id = users.user_id
        where users.handle_lc is not null
            and (
                target_user_ids is null
                or users.user_id = any(target_user_ids)
            )
    )
select a.user_id,
    a.handle_lc,
    a.play_count,
    a.follower_count,
    a.challenge_count,
    a.following_count,
    a.chat_block_count,
    a.audius_impersonator,
    (
        a.play_count + a.follower_count - a.challenge_count - (a.chat_block_count * 10) + case
            when a.following_count < 5 then -1
            else 0
        end + case
            when a.audius_impersonator then -1000
            else 0
        end
    ) as score
from aggregate_scores a;
$function$;