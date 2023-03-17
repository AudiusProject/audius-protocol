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
