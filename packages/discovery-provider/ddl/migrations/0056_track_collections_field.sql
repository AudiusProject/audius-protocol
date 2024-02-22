BEGIN;

  alter table tracks
  add column if not exists collections_containing_track jsonb default null;

COMMIT;
