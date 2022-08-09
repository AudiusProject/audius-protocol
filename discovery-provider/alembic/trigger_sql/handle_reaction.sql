create or replace function handle_reaction() returns trigger as $$
declare
  sender_user_id int;
begin

  select user_id into sender_user_id from users where users.wallet=new.sender_wallet and is_current limit 1;
  
  if sender_user_id is not null then
    insert into notification
      (slot, user_ids, timestamp, type, specifier, data)
    values
      (
      new.slot,
      ARRAY [sender_user_id],
      new.timestamp,
      'reaction',
      'reaction:' || 'reaction_to:' || new.reacted_to || ':slot:' || new.slot,
      json_build_object('sender_wallet', new.sender_wallet, 'reaction_type', new.reaction_type, 'reacted_to', new.reacted_to, 'reaction_value', new.reaction_value)
    )
    on conflict do nothing;
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
