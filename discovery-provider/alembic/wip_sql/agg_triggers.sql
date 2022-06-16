alter table aggregate_user alter column track_count set default 0;
alter table aggregate_user alter column playlist_count set default 0;
alter table aggregate_user alter column album_count set default 0;
alter table aggregate_user alter column follower_count set default 0;
alter table aggregate_user alter column following_count set default 0;
alter table aggregate_user alter column repost_count set default 0;
alter table aggregate_user alter column track_save_count set default 0;

alter table aggregate_track alter column repost_count set default 0;
alter table aggregate_track alter column save_count set default 0;


-- it's easy for follow, repost, save
-- but playlist, album, track is more tricky due to updates
-- two options:
--   1. add column like `is_update` and python code sets it true when it's an update
--      but how does the python code even know?
--   2. do a query in the plpgsql trigger to see if id already exists
-- 
-- I'm kinda leaning twards #2


create or replace function is_milestone (integer)
  returns integer
  as $$
declare
  arr integer[] := array[3, 10, 20, 30, 40, 50];
  idx integer;
begin
  idx := array_position(arr, $1);
  return arr[idx];
end;
$$
language plpgsql;


--- FOLLOWS
create or replace function handle_follow() returns trigger as $$
declare
  new_follower_count int;
  milestone integer;
begin

  insert into aggregate_user (user_id) values (new.followee_user_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.follower_user_id) on conflict do nothing;

  if new.is_delete then

    update aggregate_user 
    set follower_count = follower_count - 1 
    where user_id = new.followee_user_id;

    update aggregate_user 
    set following_count = following_count - 1 
    where user_id = new.follower_user_id;

  else

    update aggregate_user 
    set following_count = following_count + 1 
    where user_id = new.follower_user_id;

    update aggregate_user 
    set follower_count = follower_count + 1 
    where user_id = new.followee_user_id
    returning follower_count into new_follower_count;

    milestone := is_milestone(new_follower_count);
    if milestone is not null then
      insert into milestones 
        (id, name, threshold, blocknumber, slot, timestamp)
      values
        (new.followee_user_id, 'FOLLOWER_COUNT', milestone, new.blocknumber, new.slot, new.created_at)
      on conflict do nothing;
    end if;

  end if;

  return null;
end; 
$$ language plpgsql;


drop trigger if exists trg_follows on follows;
create trigger trg_follows
  after insert on follows
  for each row execute procedure handle_follow();


--



--- SAVES
create or replace function handle_save() returns trigger as $$
declare
  new_val int;
  milestone integer;
begin

  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;

  if new.save_type = 'track' then
    
    insert into aggregate_track (track_id) values (new.save_item_id) on conflict do nothing;

    if new.is_delete then

      update aggregate_user 
      set track_save_count = track_save_count - 1 
      where user_id = new.user_id;

      update aggregate_track 
      set save_count = save_count - 1 
      where track_id = new.save_item_id;

    else

      update aggregate_user 
      set track_save_count = track_save_count + 1 
      where user_id = new.user_id;

      update aggregate_track 
      set save_count = save_count + 1 
      where track_id = new.save_item_id
      returning save_count into new_val;

      milestone := is_milestone(new_val);
      if milestone is not null then
        insert into milestones 
          (id, name, threshold, blocknumber, slot, timestamp)
        values
          (new.save_item_id, 'SAVE_COUNT', milestone, new.blocknumber, new.slot, new.created_at)
        on conflict do nothing;
      end if;

    end if;
  end if;

  return null;
end; 
$$ language plpgsql;


drop trigger if exists trg_saves on saves;
create trigger trg_saves
  after insert on saves
  for each row execute procedure handle_save();






--- REPOSTS
create or replace function handle_repost() returns trigger as $$
declare
  new_val int;
  milestone integer;
begin
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;

  if new.repost_type = 'track' then
    
    insert into aggregate_track (track_id) values (new.repost_item_id) on conflict do nothing;

    if new.is_delete then

      update aggregate_user 
      set repost_count = repost_count - 1 
      where user_id = new.user_id;

      update aggregate_track 
      set repost_count = repost_count - 1 
      where track_id = new.repost_item_id;

    else

      update aggregate_user 
      set repost_count = repost_count + 1 
      where user_id = new.user_id;

      update aggregate_track 
      set repost_count = repost_count + 1 
      where track_id = new.repost_item_id
      returning repost_count into new_val;

      milestone := is_milestone(new_val);
      if milestone is not null then
        insert into milestones 
          (id, name, threshold, blocknumber, slot, timestamp)
        values
          (new.repost_item_id, 'REPOST_COUNT', milestone, new.blocknumber, new.slot, new.created_at)
        on conflict do nothing;
      end if;

    end if;
  end if;

  return null;
end; 
$$ language plpgsql;


drop trigger if exists trg_reposts on reposts;
create trigger trg_reposts
  after insert on reposts
  for each row execute procedure handle_repost();



create or replace function handle_track() returns trigger as $$
begin

  -- is this a valid way to determine if a track is new
  if new.create_ts = new.update_ts and not is_unlisted then

    insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;
    insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;
    
    update aggregate_user 
    set track_count = track_count + 1 
    where user_id = new.owner_id;

  end if;

end; 
$$ language plpgsql;


drop trigger if exists trg_reposts on reposts;
create trigger trg_reposts
  after update on reposts
  for each row execute procedure handle_repost();