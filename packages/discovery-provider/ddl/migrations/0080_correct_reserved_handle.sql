begin;

update users
set handle = 'lilpump2'
where handle_lc = 'lilpump';

update users
set handle_lc = 'lilpump2'
where handle_lc = 'lilpump';

commit;
