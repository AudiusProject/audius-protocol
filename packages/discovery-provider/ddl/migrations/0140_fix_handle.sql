begin;

update users
set handle = 'cf935d736d'
where handle_lc = 'hopelessrecords';

update users
set is_verified = false
where handle_lc = 'hopelessrecords';

update users
set handle_lc = 'cf935d736d'
where handle_lc = 'hopelessrecords';

update users
set handle = 'hopelessrecords'
where handle_lc = 'hopelessrecordsofficial';

update users
set handle_lc = 'hopelessrecords'
where handle_lc = 'hopelessrecordsofficial';

update users
set is_verified = true
where handle_lc = 'hopelessrecords';

commit;
