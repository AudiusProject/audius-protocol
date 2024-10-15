create or replace function handle_comment_mention() returns trigger as $$
declare
  comment_user_id int;
  entity_user_id int;
  entity_id int;
  entity_type text;
begin
  select comments.user_id, comments.entity_id, comments.entity_type
  into comment_user_id , entity_id, entity_type
  from comments 
  where comment_id = new.comment_id;

  select tracks.owner_id 
  into entity_user_id 
  from tracks 
  where track_id = entity_id;

  begin
    if new.user_id != entity_user_id then
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        ( 
          new.blocknumber,
          ARRAY [new.user_id], 
          new.created_at, 
          'comment_mention',
          comment_user_id,
          'comment_mention:' || entity_id || ':type:' || entity_type,
          json_build_object
          (
            'type', entity_type,
            'entity_id', entity_id,
            'entity_user_id', entity_user_id,
            'comment_user_id', comment_user_id
          )
        )
      on conflict do nothing;
    end if;
  end;

  return null;

exception
    when others then
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
      return null;
end;
$$ language plpgsql;

do $$ begin
  create trigger on_comment_mention
  after insert on comment_mentions
  for each row execute procedure handle_comment_mention();
exception
  when others then null;
end $$;