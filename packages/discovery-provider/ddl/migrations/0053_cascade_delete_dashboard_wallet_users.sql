alter table dashboard_wallet_users drop constraint if exists dashboard_wallet_users_blocknumber_fkey;
alter table dashboard_wallet_users add constraint dashboard_wallet_users_blocknumber_fkey foreign key (blocknumber) references blocks(number) on delete cascade;
