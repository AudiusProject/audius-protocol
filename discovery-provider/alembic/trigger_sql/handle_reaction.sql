create or replace function handle_reaction() returns trigger as $$
declare
  tip_row notification%ROWTYPE;
  sender_user_id int;
  receiver_user_id int;
  tip_amount bigint;
begin
  
  if new.reaction_type = 'tip' then

    select amount, sender_user_id, receiver_user_id into tip_amount, sender_user_id, receiver_user_id from user_tips ut where ut.signature == new.reacted_to;

    if sender_user_id is not null and receiver_user_id is not null then

      insert into notification
        (slot, user_ids, timestamp, type, specifier, group_id, data)
      values
        (
        new.slot,
        ARRAY [sender_user_id],
        new.timestamp,
        'reaction',
        receiver_user_id,
        'reaction:' || 'reaction_to:' || new.reacted_to || ':reaction_type:' || new.reaction_type || ':reaction_value:' || new.reaction_value || ':timestamp:' || new.timestamp,
        json_build_object(
          'sender_wallet', new.sender_wallet,
          'reaction_type', new.reaction_type,
          'reacted_to', new.reacted_to,
          'reaction_value', new.reaction_value,
          'receiver_user_id', receiver_user_id,
          'sender_user_id', sender_user_id,
          'tip_amount', tip_amount::varchar(255)
        )
      )
      on conflict do nothing;

      -- find the notification for tip send - update the data to include reaction value
      select * into tip_row from user_tips where user_tips.signature = new.reacted_to limit 1;
      if tip_row is not null then
        UPDATE notification
        SET data = jsonb_set(
          notification.data,
          'reaction_value',
          tip_row.reaction_value
        )
        WHERE notification.group_id = 'tip_receive:user_id:' || receiver_user_id || ':signature:' || new.reacted_to;
      end if;
    end if;
  end if;

  return null;

exception
  when others then return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_reaction
    after insert on reactions
    for each row execute procedure handle_reaction();
exception
  when others then null;
end $$;
