begin;

update users
set handle = 'cf935d736f'
where handle_lc = 'bassnectar';

update users
set handle_lc = 'cf935d736f'
where handle_lc = 'bassnectar';

commit;
