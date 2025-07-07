begin;

CREATE INDEX IF NOT EXISTS idx_fanout_not_deleted 
ON follows(follower_user_id, followee_user_id)
WHERE is_delete = false;

commit;
