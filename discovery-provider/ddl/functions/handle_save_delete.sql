
create or replace function handle_save_delete() returns trigger as $$
declare
  delta int;
begin
  -- increment or decrement?
  if old.is_delete then
    delta := 1;
  else
    delta := -1;
  end if;

  -- update agg track or playlist
  if old.save_type = 'track' then

    update
      aggregate_track
      set save_count = save_count + delta
    where
      track_id = old.save_item_id;


    -- update agg user
    update
      aggregate_user
    set track_save_count = track_save_count + delta
    where
      user_id = old.user_id;

  else

    update aggregate_playlist
    set save_count = save_count + delta
    where playlist_id = old.save_item_id;

  end if;

  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      raise;

end;
$$ language plpgsql;


do $$ begin
  create trigger on_save_delete
  after delete on saves
  for each row execute procedure handle_save_delete();
exception
  when others then null;
end $$;
