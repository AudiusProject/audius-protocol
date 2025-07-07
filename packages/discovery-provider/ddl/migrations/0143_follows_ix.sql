begin;

CREATE INDEX IF NOT EXISTS idx_fanout 
ON follows (follower_user_id, followee_user_id);

commit;

