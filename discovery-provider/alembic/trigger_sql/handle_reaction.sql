create or replace function handle_reaction() returns trigger as $$
declare
  sender_user_id int;
begin

  select user_id into sender_user_id from users where users.wallet=new.sender_wallet and is_current limit 1;
  
  -- create a notification for the challenge disbursement
  insert into notification
    (slot, user_ids, timestamp, type, id, metadata)
  values
    (
		new.slot,
		ARRAY [sender_user_id],
		new.timestamp,
		'reaction',
        'reaction:' || 'reaction_to:' || new.reacted_to,
		('{ "sender_wallet": "' || new.sender_wallet || '",  "reaction_type": "' || new.reaction_type || '",  "reacted_to": "' || new.reacted_to || '",  "reaction_value": ' || new.reaction_value ||  '}')::json
	);
	
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
