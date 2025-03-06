create or replace function get_shadowbanned_users(user_ids integer []) returns table (user_id integer) language plpgsql as $$ begin return query with scoped_users as (
        select users.user_id
        from users
        where users.user_id = any (user_ids)
    ),
    play_activity as (
        select plays.user_id,
            count(distinct date_trunc('minute', plays.created_at)) as play_count
        from plays
        where plays.user_id is not null
            and plays.user_id in (
                select scoped_users.user_id
                from scoped_users
            )
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
            and users.user_id in (
                select scoped_users.user_id
                from scoped_users
            )
        group by users.user_id,
            users.handle_lc,
            users.created_at
        order by users.created_at desc
    ),
    aggregate_scores as (
        select users.user_id,
            users.handle_lc,
            users.created_at,
            coalesce(play_activity.play_count, 0) as play_count,
            coalesce(fast_challenge_completion.challenge_count, 0) as challenge_count,
            coalesce(aggregate_user.following_count, 0) as following_count,
            coalesce(aggregate_user.follower_count, 0) as follower_count
        from users
            left join play_activity on users.user_id = play_activity.user_id
            left join fast_challenge_completion on users.user_id = fast_challenge_completion.user_id
            left join aggregate_user on aggregate_user.user_id = users.user_id
        where users.handle_lc is not null
            and users.user_id in (
                select scoped_users.user_id
                from scoped_users
            )
        order by users.created_at desc
    ),
    computed_scores as (
        select a.user_id,
            a.handle_lc,
            a.play_count,
            a.follower_count,
            a.challenge_count,
            a.following_count,
            (
                a.play_count + a.follower_count - a.challenge_count + case
                    when a.following_count < 5 then -1
                    else 0
                end
            ) as overall_score
        from aggregate_scores a
    )
select computed_scores.user_id
from computed_scores
where overall_score < 0;
-- filter based on threshold
end;
$$;