begin;

delete from notification where group_id like '%challenge:e%';

commit;
