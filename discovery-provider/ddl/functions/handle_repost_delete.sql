
create or replace function handle_repost_delete() returns trigger as $$
declare
  delta int;
begin
  if not old.is_current then
    return null;
  end if;

  -- increment or decrement?
  if old.is_delete then
    delta := 1;
  else
    delta := -1;
  end if;

  -- update agg user
  update aggregate_user
  set repost_count = repost_count + delta
  where user_id = old.user_id;

  -- update agg track or playlist
  if old.repost_type = 'track' then
    update aggregate_track
    set repost_count = repost_count + delta
    where track_id = old.repost_item_id;
  else
    update aggregate_playlist
    set repost_count = repost_count + delta
    where playlist_id = old.repost_item_id;
  end if;


  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_repost_delete
  after delete on reposts
  for each row execute procedure handle_repost_delete();
exception
  when others then null;
end $$;
