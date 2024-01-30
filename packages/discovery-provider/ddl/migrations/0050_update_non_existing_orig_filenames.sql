begin;

-- disable triggers
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

-- orig_filename for non-stems i.e. full/parent tracks
update tracks
set orig_filename = concat(title, '.mp3')
where is_current is true
and stem_of is null
and orig_filename is null;

-- orig_file_cid for non-stems i.e. full/parent tracks
update tracks
set orig_file_cid = track_cid
where is_current is true
and stem_of is null
and orig_file_cid is null;

-- orig_filename for stems
update tracks t
set t.orig_filename = concat(title_tracks.title, ' - ', (t.stem_of->>'category')::text, '.mp3')
from (
  select track_id, title from tracks
  where is_current is true
  and stem_of is null
) as title_tracks
where t.is_current is true
and (t.stem_of->>'category')::text != ''
and (t.stem_of->>'parent_track_id')::int = title_tracks.track_id
and t.orig_filename is null;

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
