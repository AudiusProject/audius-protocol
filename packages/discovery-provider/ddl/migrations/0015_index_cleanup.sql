-- never used
drop index if exists ix_plays_user_play_item_date;  -- 5.7GB
drop index if exists ix_plays_user_play_item; -- 3.7GB
drop index if exists ix_updated_at; -- 3GB
drop index if exists play_item_idx; -- 2.7GB
drop index if exists play_updated_at_idx; -- 2.2GB

drop index if exists ix_track_trending_scores_score; -- 1.2 GB
drop index if exists ix_track_trending_scores_type; -- .5GB

drop index if exists blocks_number_idx; -- 1GB
