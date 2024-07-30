-- Add release_date to playlists / albums without it set
begin;


-- update release_date for tracks table
update tracks
set release_date = created_at
where release_date is null;

-- update release_date for playlists table
update playlists
set release_date = created_at
where release_date is null;


commit;