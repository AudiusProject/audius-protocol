begin;

create index if not exists idx_genre_related_artists on aggregate_user(dominant_genre, follower_count, user_id);

commit;