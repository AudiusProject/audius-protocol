begin;

alter table challenge_disbursements 
add column created_at timestamp with time zone default now();

create index idx_challenge_disbursements_created_at 
on challenge_disbursements (created_at);

alter table challenges
add column weekly_pool integer default null;

commit;
