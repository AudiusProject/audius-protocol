CREATE OR REPLACE FUNCTION public.on_verified_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  owner_is_verified BOOLEAN;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'tracks' THEN
      BEGIN
        SELECT is_verified into owner_is_verified FROM users WHERE user_id = new.owner_id LIMIT 1;
        IF NOT owner_is_verified AND new.updated_at = new.created_at THEN
          PERFORM pg_notify('verified_activity', json_build_object('entity', TG_TABLE_NAME, 'created_at', new.created_at, 'updated_at', new.updated_at, 'track_id', new.track_id, 'user_id', new.owner_id)::text);
        END IF;
      END;
    WHEN 'users' THEN
      PERFORM pg_notify('verified_activity', json_build_object('old', json_build_object('is_verified', old.is_verified, 'updated_at', old.updated_at, 'user_id', old.user_id), 'entity', TG_TABLE_NAME, 'new', json_build_object('is_verified', new.is_verified, 'updated_at', new.updated_at, 'user_id', new.user_id))::text);
    ELSE
      RETURN NULL;
  END CASE;
  RETURN NULL;
END;
$function$
