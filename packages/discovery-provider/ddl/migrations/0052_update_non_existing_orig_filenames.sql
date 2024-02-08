begin;

-- disable triggers
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

-- orig_filename for non-stems i.e. full/parent tracks
update tracks t
set t.orig_filename = concat(t.title, ' - [', u.name, '].mp3')
from (
  select user_id, name from users
  where is_current is true
) as u
where t.is_current is true
and t.user_id = u.user_id
and t.stem_of is null
and t.orig_filename is null;

-- orig_file_cid for non-stems i.e. full/parent tracks
update tracks
set orig_file_cid = track_cid
where is_current is true
and stem_of is null
and orig_file_cid is null;

-- orig_filename for stems
update tracks tr
set tr.orig_filename = concat(
  sub.parent_title,
  ' - ',
  (sub.stem_of->>'category')::text,
  case when sub.row_num > 1 then concat(' ', sub.row_num) else '',
  '.mp3'
)
from (
  select
    t.stem_of,
    t.track_id,
    title_tracks.title as parent_title,
    title_tracks.track_id as parent_track_id,
    row_number() over(partition by title_tracks.track_id, t.stem_of order by t.track_id) as row_num
  from tracks t
  join (
    select track_id, title from tracks
    where is_current is true
    and stem_of is null
  ) as title_tracks
  on (t.stem_of->>'parent_track_id')::int = title_tracks.track_id
  where t.is_current is true
  and (t.stem_of->>'category')::text != ''
  and t.orig_filename is null
) as sub
where tr.is_current is true
and tr.track_id = sub.track_id;

-- orig_file_cid for stems
update tracks
set orig_file_cid = track_cid
where is_current is true
and (stem_of->>'category')::text != ''
and orig_file_cid is null;

-- re-enable triggers
alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;

commit;
