BEGIN;
create or replace function handle_on_user_challenge() returns trigger as $$
declare cooldown_days integer;
existing_notification integer;
begin if (new.is_complete = true) then -- attempt to insert a new notification, ignoring conflicts
select challenges.cooldown_days into cooldown_days
from challenges
where id = new.challenge_id;
if (
    cooldown_days is null
    or cooldown_days = 0
) then -- Check if there is an existing notification with the same fields in the last 15 minutes
if new.challenge_id not in ('tt', 'tp', 'tut') then
insert into notification (
        blocknumber,
        user_ids,
        timestamp,
        type,
        group_id,
        specifier,
        data
    )
values (
        new.completed_blocknumber,
        ARRAY [new.user_id],
        new.completed_at,
        'claimable_reward',
        'claimable_reward:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
        new.specifier,
        json_build_object(
            'specifier',
            new.specifier,
            'challenge_id',
            new.challenge_id,
            'amount',
            new.amount
        )
    ) on conflict do nothing;
end if;
insert into notification (
        blocknumber,
        user_ids,
        timestamp,
        type,
        group_id,
        specifier,
        data
    )
values (
        new.completed_blocknumber,
        ARRAY [new.user_id],
        new.completed_at,
        'challenge_reward',
        'challenge_reward:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
        new.user_id,
        json_build_object(
            'specifier',
            new.specifier,
            'challenge_id',
            new.challenge_id,
            'amount',
            new.amount::text || '00000000'
        ) -- convert amount
    ) on conflict do nothing;
else -- transactional notifications cover this 
if (
    new.challenge_id != 'b'
    and new.challenge_id != 's'
) then
select id into existing_notification
from notification
where type = 'reward_in_cooldown'
    and new.user_id = any(user_ids)
    and timestamp >= (new.completed_at - interval '1 hour')
limit 1;
if existing_notification is null then
insert into notification (
        blocknumber,
        user_ids,
        timestamp,
        type,
        group_id,
        specifier,
        data
    )
values (
        new.completed_blocknumber,
        ARRAY [new.user_id],
        new.completed_at,
        'reward_in_cooldown',
        'reward_in_cooldown:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
        new.specifier,
        json_build_object(
            'specifier',
            new.specifier,
            'challenge_id',
            new.challenge_id,
            'amount',
            new.amount
        )
    ) on conflict do nothing;
end if;
end if;
end if;
end if;
return new;
end;
$$ language plpgsql;
do $$ begin create trigger on_user_challenge
after
insert
    or
update on user_challenges for each row execute procedure handle_on_user_challenge();
exception
when others then null;
end $$;
DO $$ BEGIN -- run only on prod
IF EXISTS (
    SELECT *
    FROM "blocks"
    WHERE "blockhash" = '0xe9b0f40bb2356d4fbedde96671503475c1c6c994c7eda082f046f7e9923c6e16'
) THEN -- check whether the data has already been backfilled and return early for idempotency
-- ========== one shot trigger ==========
WITH max_block AS (
    SELECT MAX(number) AS completed_blocknumber
    FROM blocks
),
one_shot_users AS (
    SELECT temp.handle_lc,
        temp.amount,
        users.user_id
    FROM temp_prod_airdrop temp
        JOIN users ON temp.handle_lc = users.handle_lc
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
        completed_at
    )
SELECT osu.user_id,
    'o' AS challenge_id,
    CONCAT(to_hex(user_id), ':', to_hex(1)) AS specifier,
    -- user_id:nth_shot for future proofing
    TRUE AS is_complete,
    0 AS current_step_count,
    mb.completed_blocknumber,
    CAST(osu.amount AS INT) AS amount,
    NOW() AS created_at,
    NOW() AS created_at
FROM one_shot_users osu,
    max_block mb;
END IF;
END $$;
COMMIT;