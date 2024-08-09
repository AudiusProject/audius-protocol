begin;

-- Update playlists with slashes in their routes, creating rows without slashes.
-- It may be trickier than it seems at a first glance.

-- Create a CTE for all of the rows we'd like to update
with updatable_routes as (
  -- We need a unique set of playlists, if we don't distinct here, if two routes exist
  -- my/best-track and my//best-track, they would otherwise produce the same update, which
  -- would be a constraint violation
	select distinct on (replace(slug, '/', ''), replace(title_slug, '/', '')) *
	from playlist_routes pr1
	where
		(pr1.slug like '%/%' or pr1.title_slug like '%/%') and
    -- We also don't want to grab any rows to update if there already is
    -- a value in the table without the '/'. That would also be a constraint violation.
		not exists (
			select 1
			from playlist_routes pr2
			where
				(pr1.slug like '%/%' or pr1.title_slug like '%/%') and
				pr2.slug = replace(pr1.slug, '/', '') and
				pr2.title_slug = replace(pr2.title_slug, '/', '') and
				pr2.playlist_id = pr1.playlist_id and
				pr2.owner_id = pr1.owner_id
		)
)
-- Actually do the update here. Replace title slug and slug where matching.
update playlist_routes pr
set
	slug = replace(pr.slug, '/', ''),
  title_slug = replace(pr.title_slug, '/', '')
from updatable_routes ur
where
	ur.playlist_id = pr.playlist_id and
	ur.owner_id = pr.owner_id and
	ur.slug = pr.slug and
	ur.title_slug = pr.title_slug;

commit;
