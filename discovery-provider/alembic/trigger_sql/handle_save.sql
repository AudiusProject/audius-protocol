
create or replace function handle_save() returns trigger as $$
declare
  new_val int;
  milestone_name text;
  milestone integer;
begin

  -- update agg track or playlist
  if new.save_type = 'track' then
    milestone_name := 'TRACK_SAVE_COUNT';

    update aggregate_track 
    set save_count = (
      SELECT count(*)
      FROM saves r
      WHERE
          r.is_current IS TRUE
          AND r.is_delete IS FALSE
          AND r.save_type = new.save_type
          AND r.save_item_id = new.save_item_id
    )
    where track_id = new.save_item_id
    returning save_count into new_val;

    -- update agg user
    update aggregate_user 
    set track_save_count = (
      select count(*)
      from saves r
      where r.is_current IS TRUE
        AND r.is_delete IS FALSE
        AND r.user_id = new.user_id
        AND r.save_type = new.save_type
    )
    where user_id = new.user_id;

  else
    milestone_name := 'PLAYLIST_SAVE_COUNT';

    update aggregate_playlist
    set save_count = (
      SELECT count(*)
      FROM saves r
      WHERE
          r.is_current IS TRUE
          AND r.is_delete IS FALSE
          AND r.save_type = new.save_type
          AND r.save_item_id = new.save_item_id
    )
    where playlist_id = new.save_item_id
    returning save_count into new_val;
  end if;

  -- create a milestone if applicable
  select new_val into milestone where new_val in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if new.is_delete = false and milestone is not null then
    insert into milestones 
      (id, name, threshold, blocknumber, slot, timestamp)
    values
      (new.save_item_id, milestone_name, milestone, new.blocknumber, new.slot, new.created_at)
    on conflict do nothing;
  end if;

  return null;
end; 
$$ language plpgsql;


do $$ begin
  create trigger on_save
  after insert on saves
  for each row execute procedure handle_save();
exception
  when others then null;
end $$;
