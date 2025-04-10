begin;

delete from track_trending_scores where version != 'pnagD';

create index ix_trending_scores
on track_trending_scores (type, version, time_range, score desc)
include (track_id);

commit;
