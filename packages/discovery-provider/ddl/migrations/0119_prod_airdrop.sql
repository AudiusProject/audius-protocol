BEGIN;
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