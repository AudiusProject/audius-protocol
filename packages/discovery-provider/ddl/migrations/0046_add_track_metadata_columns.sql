begin;

-- disable triggers
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

-- add new columns
alter table tracks add column if not exists is_downloadable boolean not null default false;
alter table tracks add column if not exists is_download_gated boolean not null default false;
alter table tracks add column if not exists download_conditions jsonb;
alter table tracks add column if not exists is_original_available boolean not null default false;
alter table tracks add column if not exists orig_file_cid varchar;
alter table tracks add column if not exists orig_filename varchar;

-- set new downloadable column to true for donwloadable tracks
update tracks set is_downloadable = true where is_current is true and (download->>'is_downloadable')::boolean is true;

-- set track cid for downloadable tracks whose track cid columns are missing values
update tracks t set track_cid = download_cid.cid
from (
  select track_id, download->>'cid' as cid from tracks
  where is_current is true
  and track_cid is null
  and (download->>'cid')::text != ''
) as download_cid
where t.is_current is true
and t.track_id = download_cid.track_id;

-- inherit download conditions from premium conditions for stream gated tracks
update tracks set is_download_gated = true where is_current is true and is_premium is true;
update tracks set download_conditions = premium_conditions where is_current is true and is_premium is true;

-- set follow gated download conditions for non stream gated tracks that require follow for download
update tracks t
set is_download_gated = true, download_conditions = jsonb_build_object('follow_user_id', download_requires_follow.owner_id)
from (
  select track_id, owner_id from tracks
  where is_current is true
  and is_premium is false
  and (download->>'requires_follow')::boolean is true
) as download_requires_follow
where t.is_current is true
and t.track_id = download_requires_follow.track_id;

-- re-enable triggers
alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;

commit;
