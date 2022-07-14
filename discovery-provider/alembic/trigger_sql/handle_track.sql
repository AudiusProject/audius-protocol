create or replace function handle_track() returns trigger as $$
declare
  old_row tracks%ROWTYPE;
  new_val int;
  delta int := 0;
  parent_track_owner_id int;
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

  -- If remix, create notification
  begin
    if new.remix_of is not null then
      select owner_id into parent_track_owner_id from tracks where is_current and track_id = (new.remix_of->'tracks'->0->>'parent_track_id')::int limit 1;
      if parent_track_owner_id is not null then
        insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, metadata)
        values
        (
          new.blocknumber,
          ARRAY [parent_track_owner_id],
          new.updated_at,
          'remix',
          'remix:' || new.track_id || ':parent_track:' || (new.remix_of->'tracks'->0->>'parent_track_id')::int || ':blocknumber:' || new.blocknumber,
          ('{ "track_id": ' || new.track_id || ',  "parent_track_id": ' || (new.remix_of->'tracks'->0->>'parent_track_id')::int ||  '}')::json
        );
      end if;
    end if;
	exception
		when others then
		raise notice 'Error creating remix notification for track_id %', new.track_id;
	end;

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
