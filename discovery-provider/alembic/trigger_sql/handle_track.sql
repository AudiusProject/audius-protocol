create or replace function handle_track() returns trigger as $$
begin
  insert into aggregate_track (track_id) values (new.track_id) on conflict do nothing;
  insert into aggregate_user (user_id) values (new.owner_id) on conflict do nothing;

  update aggregate_user 
  set track_count = (
    select count(*)
    from tracks t
    where t.is_current IS TRUE
      AND t.is_delete IS FALSE
      AND t.is_unlisted IS FALSE
      AND t.stem_of IS NULL
      AND t.owner_id = new.owner_id
  )
  where user_id = new.owner_id
  ;

  return null;
end;
$$ language plpgsql;



do $$ begin
  create trigger on_track
  after insert on tracks
  for each row execute procedure handle_track();
exception
  when others then null;
end $$;
