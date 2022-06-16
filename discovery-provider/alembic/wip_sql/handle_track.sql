create or replace function handle_track() returns trigger as $$
declare
  is_update boolean := false;
  new_val int;
begin
  -- ensure agg_track
  -- this could be the only place we do this one:
  insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;

  -- for extra safety ensure agg_user
  -- this could happen in (not yet written) handle_user
  insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;


  -- if it's a new track increment agg user track_count
  select true into is_update from tracks where is_current = false and track_id = new.track_id limit 1;

  if new.is_delete = false and new.is_unlisted = false and new.stem_of is null and is_update = false then
    raise notice 'new track_id: % for user_id: %', new.track_id, new.owner_id;
    update aggregate_user 
    set track_count = track_count + 1
    where user_id = new.owner_id
    returning track_count into new_val;
  end if;

  -- TODO: if is_deleted or is_unlisted changes, we should decrement

  return null;
end;
$$ language plpgsql;



drop trigger if exists on_track on tracks;
create trigger on_track
  after insert on tracks
  for each row execute procedure handle_track();