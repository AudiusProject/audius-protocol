create or replace function handle_comment_thread() returns trigger as $$
declare
  parent_comment_user_id int;
  comment_user_id int;
  entity_user_id int;
  entity_id int;
  entity_type text;
  blocknumber int;
  created_at timestamp without time zone;
  notification_muted boolean;
begin
  select comments.user_id, comments.entity_id, comments.entity_type 
  into parent_comment_user_id, entity_id, entity_type 
  from comments 
  where comment_id = new.parent_comment_id;

  select comments.user_id, comments.blocknumber, comments.created_at
  into comment_user_id, blocknumber, created_at
  from comments 
  where comment_id = new.comment_id;

  select tracks.owner_id 
  into entity_user_id 
  from tracks 
  where track_id = entity_id;

  select comment_notification_settings.is_muted
  into notification_muted
  from comment_notification_settings
  where user_id = parent_comment_user_id 
  and comment_notification_settings.entity_id = new.parent_comment_id
  and comment_notification_settings.entity_type = 'Comment';

  begin
    if notification_muted is not true and comment_user_id != parent_comment_user_id then
      insert into notification
        (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
        values
        ( 
          blocknumber,
          ARRAY [parent_comment_user_id],
          created_at, 
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