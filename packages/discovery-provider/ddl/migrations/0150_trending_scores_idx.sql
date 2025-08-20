begin;

CREATE INDEX IF NOT EXISTS idx_tts_genre_time_score
ON track_trending_scores (genre, time_range, score DESC, track_id);

commit;
