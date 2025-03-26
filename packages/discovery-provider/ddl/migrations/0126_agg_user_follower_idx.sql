CREATE INDEX IF NOT EXISTS idx_aggregate_user_follower_count
ON aggregate_user (user_id, follower_count);
