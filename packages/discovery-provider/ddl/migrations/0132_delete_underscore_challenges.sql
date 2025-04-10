begin;

DELETE FROM user_challenges WHERE specifier LIKE '%\_%';

commit;
