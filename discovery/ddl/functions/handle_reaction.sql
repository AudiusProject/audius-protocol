create or replace function handle_reaction() returns trigger as $$
declare
  tip_row notification%ROWTYPE;
  tip_sender_user_id int;
  tip_receiver_user_id int;
  tip_amount bigint;
begin

  raise NOTICE 'start';
  
  if new.reaction_type = 'tip' then

    raise NOTICE 'is tip';

    SELECT amount, sender_user_id, receiver_user_id 
    INTO tip_amount, tip_sender_user_id, tip_receiver_user_id 
    FROM user_tips ut 
    WHERE ut.signature = new.reacted_to;
    
    raise NOTICE 'did select % %', tip_sender_user_id, tip_receiver_user_id;
    raise NOTICE 'did select %', new.reacted_to;

    IF tip_sender_user_id IS NOT NULL AND tip_receiver_user_id IS NOT NULL THEN
      raise NOTICE 'have ids';

      if new.reaction_value != 0 then
        INSERT INTO notification
          (slot, user_ids, timestamp, type, specifier, group_id, data)
        VALUES
          (
          new.slot,
          ARRAY [tip_sender_user_id],
          new.timestamp,
          'reaction',
          tip_receiver_user_id,
          'reaction:' || 'reaction_to:' || new.reacted_to || ':reaction_type:' || new.reaction_type || ':reaction_value:' || new.reaction_value,
          json_build_object(
            'sender_wallet', new.sender_wallet,
            'reaction_type', new.reaction_type,
            'reacted_to', new.reacted_to,
            'reaction_value', new.reaction_value,
            'receiver_user_id', tip_receiver_user_id,
            'sender_user_id', tip_sender_user_id,
            'tip_amount', tip_amount::varchar(255)
          )
        )
        on conflict do nothing;
      end if;

      -- find the notification for tip send - update the data to include reaction value
      UPDATE notification
      SET data = jsonb_set(data, '{reaction_value}', new.reaction_value::text::jsonb)
      WHERE notification.group_id = 'tip_receive:user_id:' || tip_receiver_user_id || ':signature:' || new.reacted_to;
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
  create trigger on_reaction
    after insert on reactions
    for each row execute procedure handle_reaction();
exception
  when others then null;
end $$;
