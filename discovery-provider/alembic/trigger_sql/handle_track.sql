create or replace function handle_track() returns trigger as $$
declare
  old_row tracks%ROWTYPE;
  new_val int;
  delta int := 0;
begin
  -- ensure agg_track
  -- this could be the only place we do this one:
  insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;

  -- for extra safety ensure agg_user
  -- this should just happen in handle_user
  insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;

  -- if it's a new track increment agg user track_count
  -- assert new.is_current = true; -- not actually true in tests
  select * into old_row from tracks where is_current = false and track_id = new.track_id order by blocknumber desc limit 1;

  -- track becomes invisible (one way change)
  if old_row.is_delete != new.is_delete then
    delta := -1;
  end if;

  if old_row is null and new.is_delete = false and new.is_unlisted = false and new.stem_of is null then
    delta := 1;
  end if;

  if delta != 0 then
    update aggregate_user 
    set track_count = track_count + delta
    where user_id = new.owner_id
    returning track_count into new_val;

    -- if delta = 1 and new_val = 3 then
    --   raise notice 'could create rewards row for: user track_count = 3';
    -- end if;
  end if;

  return null;
end;
$$ language plpgsql;



drop trigger if exists on_track on tracks;
create trigger on_track
  after insert on tracks
  for each row execute procedure handle_track();