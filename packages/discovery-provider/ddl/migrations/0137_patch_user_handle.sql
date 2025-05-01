begin;

update users
set "instagram_handle" = 'KESH', "verified_with_instagram" = false
where "handle_lc" = 'kesh.digital';

commit;