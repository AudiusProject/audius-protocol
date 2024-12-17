begin;
do $$ begin -- run only on stage
if exists (
    select *
    from "blocks"
    where "blockhash" = '0x400faf3853ffaf086d8bc415410e833c6ba284835d43f51b13ed81fe7d71a5b1'
) then -- check whether the data has already been backfilled and return early for idempotency
if exists (
    select 1
    from user_challenges
    where challenge_id = 'o'
) then return;
end if;
-- ========== one shot trigger ==========
WITH max_block AS (
    SELECT MAX(number) AS completed_blocknumber
    FROM blocks
),
WITH one_shot_users as (
    select temp.handle_lc,
        temp.amount,
        users.id as user_id,
        from temp_stage_one_shot temp
        join users on temp_stage_one_shot.handle_lc = users.handle_lc
)
INSERT INTO user_challenges (
        user_id,
        challenge_id,
        specifier,
        is_complete,
        current_step_count,
        completed_blocknumber,
        amount,
        created_at,
        completed_blocknumber
    )
SELECT osu.user_id,
    'o' as challenge_id,
    'hardcoded_specifier' AS specifier,
    TRUE AS is_complete,
    0 AS current_step_count,
    mb.completed_blocknumber,
    osu.amount AS amount,
    NOW() AS created_at,
    mb.completed_blocknumber
FROM one_shot_users osu,
    max_block mb;
end if;
end $$;
commit;