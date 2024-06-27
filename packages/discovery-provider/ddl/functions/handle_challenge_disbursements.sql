create or replace function handle_challenge_disbursement() returns trigger as $$
declare
  reward_manager_tx reward_manager_txs%ROWTYPE;
	existing_notification integer;
begin

  select * into reward_manager_tx from reward_manager_txs where reward_manager_txs.signature = new.signature limit 1;

  if reward_manager_tx is not null then
		select id into existing_notification 
		from notification
		where
		type = 'challenge_reward' and
		new.user_id = any(user_ids) and
		timestamp >= (new.created_at - interval '1 hour')
		limit 1;
		
		if existing_notification is null then
			-- create a notification for the challenge disbursement
			insert into notification
			(slot, user_ids, timestamp, type, group_id, specifier, data)
			values
			(
				new.slot,
				ARRAY [new.user_id],
				new.created_at,
				'challenge_reward',
				'challenge_reward:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
				new.user_id,
				json_build_object('specifier', new.specifier, 'challenge_id', new.challenge_id, 'amount', new.amount)
			)
			on conflict do nothing;
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
  create trigger on_challenge_disbursement
    after insert on challenge_disbursements
    for each row execute procedure handle_challenge_disbursement();
exception
  when others then null;
end $$;
