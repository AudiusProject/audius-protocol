BEGIN;

-- Find and delete duplicate user records, keeping the newest one
WITH RankedUsers AS (
    SELECT 
        user_id,
        updated_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
    FROM users
)
DELETE FROM users
WHERE user_id IN (
    SELECT user_id FROM RankedUsers WHERE rn > 1
)
AND (user_id, updated_at) IN (
    SELECT user_id, updated_at FROM RankedUsers WHERE rn > 1
);

COMMIT;