create or replace function process_grant_change() returns trigger as $$
declare
    matched_user_id integer;
begin
    -- fetch the user_id where wallet matches grantee_address
    select user_id into matched_user_id from users where lower(wallet) = lower(new.grantee_address);
    
    if matched_user_id is not null then
        if (tg_op = 'insert' and new.is_revoked = false and new.is_approved is null and new.created_at = new.updated_at or
            (tg_op = 'update' and new.is_revoked = false and old.is_revoked = true and new.is_approved is null))
        then
            insert into notification
                    (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
                  values
                    (
                      new.blocknumber,
                      array [matched_user_id],
                      new.updated_at,
                      'request_manager',
                      new.user_id,
                      'request_manager:' || 'grantee_user_id:' || matched_user_id || ':grantee_address:' || new.grantee_address || ':user_id:' || new.user_id || ':updated_at:' || new.updated_at ||
                      ':created_at:' || new.created_at,
                      json_build_object(
                          'grantee_user_id', matched_user_id,
                          'grantee_address', new.grantee_address,
                          'user_id', new.user_id
                        )
                    )
                  on conflict do nothing;
        elsif (tg_op = 'insert' and new.is_approved = true and new.is_revoked = false) or
            (tg_op = 'update' and new.is_approved = true and (old.is_approved != true) and new.is_revoked = false)
        then
            insert into notification
                    (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
                  values
                    (
                      new.blocknumber,
                      array [new.user_id],
                      new.updated_at,
                      'approve_manager_request',
                      matched_user_id,
                      'approve_manager_request:' || 'grantee_user_id:' || matched_user_id || ':grantee_address:' || new.grantee_address || ':user_id:' || new.user_id || ':updated_at:' || new.updated_at ||
                      ':created_at:' || new.created_at,
                      json_build_object(
                          'grantee_user_id', matched_user_id,
                          'grantee_address', new.grantee_address,
                          'user_id', new.user_id
                        )
                    )
                  on conflict do nothing;
        end if;
    end if;
    return null;
exception
  when others then
      raise warning 'an error occurred in %: %', tg_name, sqlerrm;
      return null;
end; 
$$ language plpgsql;

do $$ begin
  create trigger trigger_grant_change
  after insert or update on grants
  for each row execute procedure process_grant_change();
exception
  when others then null;
end $$;