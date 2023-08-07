alter table revert_blocks
drop constraint revert_blocks_blocknumber_fkey;
alter table revert_blocks
add constraint revert_blocks_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;

alter table follows
drop constraint follows_blocknumber_fkey;
alter table follows
add constraint follows_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from follows where is_current = false;


alter table playlists
drop constraint playlists_blocknumber_fkey;
alter table playlists
add constraint playlists_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from playlists where is_current = false;


alter table reposts
drop constraint reposts_blocknumber_fkey;
alter table reposts
add constraint reposts_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from reposts where is_current = false;

alter table saves
drop constraint saves_blocknumber_fkey;
alter table saves
add constraint saves_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from saves where is_current = false;


alter table tracks
drop constraint tracks_blocknumber_fkey;
alter table tracks
add constraint tracks_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from tracks where is_current = false;


alter table developer_apps
drop constraint app_delegates_blocknumber_fkey;
alter table developer_apps
add constraint app_delegates_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from developer_apps where is_current = false;


alter table grants
drop constraint delegations_blocknumber_fkey;
alter table grants
drop constraint delegations_blockhash_fkey;

alter table grants
add constraint delegations_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from grants where is_current = false;

alter table users
drop constraint users_blocknumber_fkey;
alter table users
add constraint users_blocknumber_fkey
foreign key (blocknumber)
references blocks(number)
on delete cascade;
delete from users where is_current = false;
