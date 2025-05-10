begin;

-- Add missing index on some nodes
create index if not exists ix_user_created_at on users(created_at asc nulls last, user_id asc nulls last, is_current asc nulls last);

-- Recreate saves to include created_at
drop index if exists saves_user_idx;
create index if not exists saves_user_idx on saves(user_id asc nulls last, save_type asc nulls last, save_item_id asc nulls last, is_delete asc nulls last);

commit;
