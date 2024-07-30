-- Add release_date to playlists / albums without it set
begin;

update playlists
set release_date = created_at
where release_date is null;

commit;