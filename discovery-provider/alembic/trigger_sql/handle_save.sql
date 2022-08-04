
create or replace function handle_save() returns trigger as $$
declare
  new_val int;
  milestone_name text;
  milestone integer;
  delta int;
  owner_user_id int;
  track_remix_of json;
  is_remix_cosign boolean;
begin

  insert into aggregate_user (user_id) values (new.user_id) on conflict do nothing;
  if new.save_type = 'track' then
    insert into aggregate_track (track_id) values (new.save_item_id) on conflict do nothing;
  else
    insert into aggregate_playlist (playlist_id, is_album) values (new.save_item_id, new.save_type = 'album') on conflict do nothing;
  end if;

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
  	if delta = 1 then
		  select tracks.owner_id, tracks.remix_of into owner_user_id, track_remix_of from tracks where is_current and track_id = new.save_item_id;
	  end if;
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
    if delta = 1 then
		  select playlists.playlist_owner_id into owner_user_id from playlists where is_current and playlist_id = new.save_item_id;
	  end if;

  end if;

  -- create a milestone if applicable
  select new_val into milestone where new_val in (10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000);
  if new.is_delete = false and milestone is not null then
    insert into notification
      (user_ids, type, specifier, blocknumber, timestamp, data)
      values
      (
        ARRAY [new.followee_user_id],
        'milestone',
        'milestone:' || milestone_name  || ':id:' || new.save_item_id || ':threshold:' || milestone,
        new.blocknumber,
        new.created_at,
        json_build_object('type', milestone_name, 'threshold', milestone)
      )
      on conflict do nothing;
  end if;

  begin
    -- create a notification for the saved content's owner
    if new.is_delete is false then
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, data)
        values
        ( 
          new.blocknumber,
          ARRAY [owner_user_id], 
          new.created_at, 
          'save',
          'save:' || new.save_item_id || ':type:'|| new.save_type,
          json_build_object('save_item_id', new.save_item_id, 'user_id', new.user_id, 'type', new.save_type)
        )
      on conflict do nothing;
    end if;

    -- create a notification for remix cosign
    if new.is_delete is false and new.save_type = 'track' and track_remix_of is not null then
      select 
        case when tracks.owner_id = new.user_id then TRUE else FALSE end as boolean into is_remix_cosign
        from tracks 
        where is_current and track_id = (track_remix_of->'tracks'->0->>'parent_track_id')::int;
      if is_remix_cosign then
        insert into notification
          (blocknumber, user_ids, timestamp, type, specifier, data)
          values
          ( 
            new.blocknumber,
            ARRAY [owner_user_id], 
            new.created_at, 
            'cosign',
            'cosign:' || (track_remix_of->'tracks'->0->>'parent_track_id')::int || ':blocknumber:'|| new.blocknumber,
            json_build_object('parent_track_id', (track_remix_of->'tracks'->0->>'parent_track_id')::int, 'track_id', new.save_item_id, 'track_owner_id', owner_user_id)
          )
        on conflict do nothing;
      end if;
    end if;
  exception
    when others then return null;
  end;

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
