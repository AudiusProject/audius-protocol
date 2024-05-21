begin;
alter table user_challenges add column completed_at timestamp;
update user_challenges set completed_at = created_at where is_complete;
commit;