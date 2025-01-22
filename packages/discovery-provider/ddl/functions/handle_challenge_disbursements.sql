create or replace function handle_challenge_disbursement() returns trigger as $$
declare
  reward_manager_tx reward_manager_txs%ROWTYPE;
	existing_notification integer;
begin
end;
$$ language plpgsql;


do $$ begin
  create trigger on_challenge_disbursement
    after insert on challenge_disbursements
    for each row execute procedure handle_challenge_disbursement();
exception
  when others then null;
end $$;
