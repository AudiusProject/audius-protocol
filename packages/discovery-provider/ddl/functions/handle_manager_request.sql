create or replace function process_grant_change() returns trigger as $$
declare
    matched_user_id integer;
begin
    -- fetch the user_id where wallet matches grantee_address
    select user_id into matched_user_id from users where lower(wallet) = lower(NEW.grantee_address);
    
    if matched_user_id is not null then
        -- if the grant is newly created (i.e. the grant is not deleted, is not approved yet, and was just created indicated by created timestamp = last updated timestamp) OR grant went from deleted (revoked) to not deleted and is not approved yet...
        if (TG_OP = 'INSERT' and NEW.is_revoked = FALSE and NEW.is_approved is null and NEW.created_at = NEW.updated_at or
            (TG_OP = 'UPDATE' and NEW.is_revoked = FALSE and OLD.is_revoked = TRUE and NEW.is_approved is null))
        then
            -- ... create a "request_manager" notification
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
        -- otherwise, if the grant is approved and not deleted (revoked)...
        elsif (TG_OP = 'INSERT' and NEW.is_approved = TRUE and NEW.is_revoked = FALSE) or
            (TG_OP = 'UPDATE' and NEW.is_approved = TRUE and (OLD.is_approved != TRUE) and NEW.is_revoked = FALSE)
        then
            -- ... create a "approve_manager_request" notification
            insert into notification
                    (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
                  values
                    (
                      new.blocknumber,
                      array [new.user_id],
                      new.updated_at,
                      'approve_manager_request',
                      matched_user_id,
                      'approve_manager_request:' || 'grantee_user_id:' || matched_user_id || ':grantee_address:' || new.grantee_address || ':user_id:' || new.user_id || ':created_at:' || new.created_at,
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
      raise warning 'An error occurred in %: %', tg_name, sqlerrm;
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
