CREATE OR REPLACE FUNCTION public.on_is_verified_update()
  RETURNS trigger
  LANGUAGE plpgsql
  as $$
  begin
    if TG_TABLE_NAME == "users"
      if new.is_verified is distinct from old.is_verified
        PERFORM pg_notify('users_verified', json_build_object('user_id', new.user_id, 'is_verified', new.is_verified)::text);
  end;
  $$





/*
CREATE OR REPLACE FUNCTION public.on_column_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  case TG_TABLE_NAME
    when 'users' then
      if new.is_verified is distinct from
      PERFORM pg_notify('users_verified', json_build_object('user_id', new.user_id)::text);
  end case;
  return null;
end; 
$function$
