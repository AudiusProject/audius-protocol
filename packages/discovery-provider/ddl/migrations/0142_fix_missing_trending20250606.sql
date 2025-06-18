begin;

do $$
begin
    -- run only on prod
    if exists (select * from "blocks" where "blockhash" = '0x8d5e6984014505e1e11bcbb1ca1a13bcc6ae85ac74014710a73271d82ca49f01') then
        -- insert missing trending playlists
        INSERT INTO user_challenges (
            challenge_id,
            user_id,
            specifier,
            is_complete,
            current_step_count,
            completed_blocknumber,
            amount,
            created_at,
            completed_at
        ) VALUES
            ('tp', 404814, '2025-06-06:3', true, 0, 99238406, 100, '2025-06-06 19:01:50.964352+00', '2025-06-06 19:01:50.964352+00'),
            ('tp', 94167, '2025-06-06:4', true, 0, 99238406, 100, '2025-06-06 19:01:50.964352+00', '2025-06-06 19:01:50.964352+00'),
            ('tp', 843421708, '2025-06-06:5', true, 0, 99238406, 100, '2025-06-06 19:01:50.964352+00', '2025-06-06 19:01:50.964352+00')
        on conflict do nothing;

    end if;

end $$;

commit;

