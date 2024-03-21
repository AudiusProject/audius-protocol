create or replace function handle_user_balance_change() returns trigger as $$
declare
  new_val int;
  new_tier text;
  new_tier_value int;
  previous_tier text;
  previous_tier_value int;
begin
  SELECT label, val into new_tier, new_tier_value
  FROM (
    VALUES ('bronze', 10::bigint), ('silver', 100::bigint), ('gold', 1000::bigint), ('platinum', 10000::bigint)
  ) as tier (label, val)
  WHERE
    substr(new.current_balance, 1, GREATEST(1, length(new.current_balance) - 18))::bigint >= tier.val
  ORDER BY 
    tier.val DESC
  limit 1;

  SELECT label, val into previous_tier, previous_tier_value
  FROM (
    VALUES ('bronze', 10::bigint), ('silver', 100::bigint), ('gold', 1000::bigint), ('platinum', 10000::bigint)
  ) as tier (label, val)
  WHERE
    substr(new.previous_balance, 1, GREATEST(1, length(new.previous_balance) - 18))::bigint >= tier.val
  ORDER BY 
    tier.val DESC
  limit 1;

  -- create a notification if the tier changes
  if new_tier_value > previous_tier_value or (new_tier_value is not NULL and previous_tier_value is NULL) then
    insert into notification
      (blocknumber, user_ids, timestamp, type, specifier, group_id, data)
    values
      ( 
        new.blocknumber,
        ARRAY [new.user_id], 
        new.updated_at, 
        'tier_change',
        new.user_id,
        'tier_change:user_id:' || new.user_id ||  ':tier:' || new_tier || ':blocknumber:' || new.blocknumber,
        json_build_object(
          'new_tier', new_tier,
          'new_tier_value', new_tier_value,
          'current_value', new.current_balance
        )
      )
    on conflict do nothing;
    return null;
  end if;

  return null;
exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_user_balance_changes
    after insert or update on user_balance_changes
    for each row execute procedure handle_user_balance_change();
exception
  when others then null;
end $$;
