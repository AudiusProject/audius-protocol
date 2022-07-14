create or replace function handle_challenge_disbursement() returns trigger as $$
declare
  reward_manager_tx reward_manager_txs%ROWTYPE;
begin

  select * into reward_manager_tx from reward_manager_txs where reward_manager_txs.signature = new.signature limit 1;
	
  if reward_manager_tx is not null then
	  -- create a notification for the challenge disbursement
	  insert into notification
		(slot, user_ids, timestamp, type, specifier, metadata)
	  values
		(
			new.slot,
			ARRAY [new.user_id],
			reward_manager_tx.created_at,
			'challenge_reward', 'challenge_reward:' || new.user_id || ':' || new.specifier,
			('{ "specifier": "' || new.specifier || '",  "challenge_id": "' || new.challenge_id || '",  "amount": ' || new.amount ||  '}')::json
		);
  end if;
  return null;

exception
  when others then return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_challenge_disbursement
    after insert on challenge_disbursements
    for each row execute procedure handle_challenge_disbursement();
exception
  when others then null;
end $$;
