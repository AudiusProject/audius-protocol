create or replace function compute_user_score(
        play_count bigint,
        follower_count bigint,
        challenge_count bigint,
        chat_block_count bigint,
        following_count bigint,
        is_audius_impersonator boolean,
        distinct_tracks_played bigint
    ) returns bigint as $$
select (play_count / 2) + follower_count - challenge_count - (chat_block_count * 100) + case
        when following_count < 5 then -1
        else 0
    end + case
        when is_audius_impersonator then -1000
        else 0
    end + case
        when distinct_tracks_played <= 3 then -10
        else 0
    end $$ language sql immutable;