create or replace function handle_comment() returns trigger as $$
begin
  if new.entity_type = 'Track' then
    insert into aggregate_track (track_id) 
    values (new.entity_id) 
    on conflict do nothing;
  end if;

  -- update agg track
  if new.entity_type = 'Track' then
    update aggregate_track 
    set comment_count = (
      select count(*)
      from comments c
      where
          c.is_delete is false
          and c.is_visible is true
          and c.entity_type = new.entity_type
          and c.entity_id = new.entity_id
    )
    where track_id = new.entity_id;
  end if;

  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      return null;
end;
$$ language plpgsql;

do $$ begin
  create trigger on_comment
  after insert on comments
  for each row execute procedure handle_comment();
exception
  when others then null;
end $$;