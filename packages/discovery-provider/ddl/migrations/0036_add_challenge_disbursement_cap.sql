begin;

alter table challenge_disbursements 
add column if not exists created_at timestamp with time zone default now();

create index if not exists idx_challenge_disbursements_created_at 
on challenge_disbursements (created_at);

alter table challenges
add column if not exists weekly_pool integer default null;

commit;
