-- Update notifications where type = 'comment'
-- Rename 'user_id' to 'comment_user_id' in the data JSON field
UPDATE notifications
SET data = CASE
    WHEN data ? 'user_id' AND NOT data ? 'comment_user_id' THEN
        jsonb_set(
            data - 'user_id',
            '{comment_user_id}',
            data->'user_id'
        )
    ELSE
        data
    END
WHERE type = 'comment';