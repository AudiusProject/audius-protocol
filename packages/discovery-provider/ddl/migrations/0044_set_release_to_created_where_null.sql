begin;

alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' and pid <> pg_backend_pid();
lock table tracks in access exclusive mode;

UPDATE tracks
SET release_date = created_at
WHERE release_date IS NULL;

alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;

commit;