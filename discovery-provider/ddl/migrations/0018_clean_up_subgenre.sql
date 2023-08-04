-- clean up subgenres 
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

update tracks
set genre = substring(genre from position(' - ' in genre) + 3)
where (is_current = true or is_current = false)
and genre like 'Electronic - %';

alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;
