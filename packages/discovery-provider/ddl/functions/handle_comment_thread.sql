create or replace function handle_comment_thread() returns trigger as $$
declare
  parent_comment_user_id int;
  comment_user_id int;
  entity_user_id int;
  entity_id int;
  entity_type text;
begin
  select comments.user_id, comments.entity_id, comments.entity_type 
  into parent_comment_user_id, entity_id, entity_type 
  from comments 
  where comment_id = new.parent_comment_id;

  select comments.user_id 
  into comment_user_id 
  from comments 
  where comment_id = new.comment_id;

  select tracks.owner_id 
  into entity_user_id 
  from tracks 
  where track_id = entity_id;

  raise warning 'parent_comment_user_id: %, comment_user_id: %, entity_user_id: %, entity_id: %, entity_type: %', parent_comment_user_id, comment_user_id, entity_user_id, entity_id, entity_type;

  begin
    if comment_user_id != parent_comment_user_id then
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        ( 
          new.blocknumber,
          ARRAY [parent_comment_user_id],
          new.created_at, 
          'comment_thread',
          comment_user_id,
          'comment_thread:' || new.parent_comment_id,
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
  create trigger on_comment_thread
  after insert on comment_threads
  for each row execute procedure handle_comment_thread();
exception
  when others then null;
end $$;