create or replace function handle_user_tip() returns trigger as $$
begin

  -- create a notification for the sender and receiver
  insert into notification
    (slot, user_ids, timestamp, type, specifier, data)
  values
    ( 
      new.slot,
      ARRAY [new.receiver_user_id], 
      new.created_at, 
      'tip_receive',
      'tip_receive:' || new.receiver_user_id || ':' || new.slot,
      json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'amount', new.amount)
    ),
    ( 
      new.slot,
      ARRAY [new.sender_user_id], 
      new.created_at, 
      'tip_send',
      'tip_send:' || new.sender_user_id || ':' || new.slot,
      json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'amount', new.amount)
    )
    on conflict do nothing;
  return null;
exception
  when others then return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_user_tip
    after insert on user_tips
    for each row execute procedure handle_user_tip();
exception
  when others then null;
end $$;
