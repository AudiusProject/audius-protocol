begin;

update users
set "instagram_handle" = 'ifeaturemusic', "verified_with_instagram" = false
where "handle_lc" = 'ifeature';

commit;