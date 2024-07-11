begin;

update users
set handle = 'ce935d736e'
where handle_lc = 'lilpump';

update users
set handle_lc = 'ce935d736e'
where handle_lc = 'lilpump';

commit;
