begin;

update tracks 
set is_delete = true
where ddex_app = 'fuga' and owner_id = 30352;

commit;