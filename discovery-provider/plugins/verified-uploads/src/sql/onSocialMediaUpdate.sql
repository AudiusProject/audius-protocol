  CREATE OR REPLACE FUNCTION public.on_track_upload()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $function$
  BEGIN
    CASE TG_TABLE_NAME
      WHEN 'tracks' THEN
        IF new.updated_at = new.created_at THEN
          PERFORM pg_notify('track_upload', json_build_object('entity', TG_TABLE_NAME, 'created_at', new.created_at, 'updated_at', new.updated_at, 'track_id', new.track_id, 'user_id', new.owner_id)::text);
        END IF;
      ELSE
        RETURN NULL;
    END CASE;
    RETURN NULL;
  END;
  $function$
