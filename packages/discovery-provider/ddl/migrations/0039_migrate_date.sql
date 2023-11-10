-- migrate release_date to a timestamp
begin;
lock table tracks in access exclusive mode;

alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

alter table tracks add column release_date_temp timestamp;

update tracks set release_date_temp = to_timestamp(release_date, 'YYYY-MM-DD"T"HH24:MI:SS.US')::timestamp
where release_date like '%Z';

update tracks set release_date_temp = to_timestamp(substring(release_date from 1 for 20), 'Dy Mon DD YYYY HH24:MI:SS')
where release_date like '%GMT%' and length(release_date) > 22;

alter table tracks drop column release_date;

alter table tracks rename column release_date_temp to release_date;

alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;
commit;