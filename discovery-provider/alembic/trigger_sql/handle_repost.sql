
create or replace function handle_repost() returns trigger as $$
declare
  new_val int;
  milestone_name text;
  milestone integer;
begin
  -- ensure agg rows present
  -- this can be removed if we do this elsewhere
  -- but is here now for safety
  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  if new.repost_type = 'track' then
    insert into aggregate_track (track_id) values (new.repost_item_id) on conflict do nothing;
  else
    insert into aggregate_playlist (playlist_id) values (new.repost_item_id) on conflict do nothing;
  end if;


  -- update agg user
  update aggregate_user 
  set repost_count = (
    select count(*)
    from reposts r
    where r.is_current IS TRUE
      AND r.is_delete IS FALSE
      AND r.user_id = new.user_id
  )
  where user_id = new.user_id;

  -- update agg track or playlist
  if new.repost_type = 'track' then
    milestone_name := 'TRACK_REPOST_COUNT';
    update aggregate_track 
    set repost_count = (
      SELECT count(*)
      FROM reposts r
      WHERE
          r.is_current IS TRUE
          AND r.is_delete IS FALSE
          AND r.repost_type = new.repost_type
          AND r.repost_item_id = new.repost_item_id
    )
    where track_id = new.repost_item_id
    returning repost_count into new_val;
  else
    milestone_name := 'PLAYLIST_REPOST_COUNT';
    update aggregate_playlist
    set repost_count = (
      SELECT count(*)
      FROM reposts r
      WHERE
          r.is_current IS TRUE
          AND r.is_delete IS FALSE
          AND r.repost_type = new.repost_type
          AND r.repost_item_id = new.repost_item_id
    )
    where playlist_id = new.repost_item_id
    returning repost_count into new_val;
  end if;

  -- create a milestone if applicable
  select new_val into milestone where new_val in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if new.is_delete = false and milestone is not null then
    insert into milestones 
      (id, name, threshold, blocknumber, slot, timestamp)
    values
      (new.repost_item_id, milestone_name, milestone, new.blocknumber, new.slot, new.created_at)
    on conflict do nothing;
  end if;

  return null;
end; 
$$ language plpgsql;



do $$ begin
  create trigger on_repost
  after insert on reposts
  for each row execute procedure handle_repost();
exception
  when others then null;
end $$;

