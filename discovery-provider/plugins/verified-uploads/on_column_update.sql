CREATE OR REPLACE FUNCTION public.on_new_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  case TG_TABLE_NAME
    when 'users' then
    	IF (new.is_verified IS DISTINCT FROM old.is_verified) THEN
      		PERFORM pg_notify(TG_TABLE_NAME, json_build_object('user_id', new.user_id, 'is_verified', new.is_verified)::text);
		end if;
    else
      return null;
  end case;
  return null;
end; 
$function$
