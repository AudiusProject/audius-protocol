begin;

do $$ begin

-- disable trigger
alter table user_challenges disable trigger on_user_challenge;

-- only run on prod 
if exists (select * from "blocks" where "blockhash" = 'fb1699f4b3f7b4cc6dba054d8d8f88ffb34a41bbb882254144302c9c7565ab15') then
delete from user_challenges where challenge_id = 'e' or challenge_id = 'c' and created_at < '2025-03-15';

INSERT INTO user_challenges (challenge_id, user_id, specifier, is_complete, current_step_count, completed_blocknumber, amount, created_at, completed_at)
SELECT
    challenge_id,
    user_id::integer,
    specifier,
    is_complete::boolean,
    current_step_count::integer,
    completed_blocknumber::integer,
    amount::integer,
    created_at::timestamptz,
    completed_at::timestamp
FROM temp_listen_streak_comment_challenges
ON CONFLICT (challenge_id, specifier) DO NOTHING;

-- re-enable trigger
alter table user_challenges enable trigger on_user_challenge;

end if;
end $$;
commit;
