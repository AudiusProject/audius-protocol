begin;

update playlist_routes
set slug = replace(slug, '/', ''),
    title_slug = replace(title_slug, '/', '')
where slug like '%/%' or title_slug like '%/%';

commit;
