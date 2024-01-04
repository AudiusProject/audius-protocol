SELECT pg_size_pretty( pg_total_relation_size('tracks') );

\timing

begin;
lock table tracks in access exclusive mode;
alter table tracks drop column track_segments;
alter table tracks add column track_segments jsonb not null default '[]';
commit;

vacuum full tracks;

SELECT pg_size_pretty( pg_total_relation_size('tracks') );
