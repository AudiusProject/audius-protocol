begin;

alter table aggregate_user alter column dominant_genre_count drop not null;

commit;
