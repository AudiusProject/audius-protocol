begin;
  alter table aggregate_user
  add column if not exists dominant_genre varchar default null;

  alter table aggregate_user
  add column if not exists dominant_genre_count integer not null default 0;
commit;