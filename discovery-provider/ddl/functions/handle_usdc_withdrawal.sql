create or replace function handle_usdc_withdrawal() returns trigger as $$
DECLARE
    users_row users%ROWTYPE;
begin

  if new.transaction_type = 'transfer' and new.method = 'send' then
    -- Fetch the corresponding user based on the wallet
    select into users_row users.*
    from users
    join usdc_user_bank_accounts
      on users.wallet = usdc_user_bank_accounts.ethereum_address
    where usdc_user_bank_accounts.user_bank = new.user_bank;    

    -- Insert the new notification
    insert into notification
      (slot, user_ids, timestamp, type, specifier, group_id, data)
    values
      (
        new.slot,
        ARRAY [users_row.user_id],
        new.created_at,
        'usdc_withdrawal',
        users_row.user_id,
        'usdc_withdrawal:' || users_row.user_id,
        json_build_object(
          'user_id', users_row.user_id,
          'user_bank', new.user_bank,
          'signature', new.signature,
          'change', new.change,
          'balance', new.balance
        )
      )
      on conflict do nothing;
  end if;

  return null;
  exception
    when others then
        raise warning 'An error occurred in %: %', tg_name, sqlerrm;
        return null;

end;
$$ language plpgsql;

do $$ begin
  create trigger on_usdc_withdrawal
  after insert on usdc_transactions_history
  for each row execute procedure handle_usdc_withdrawal();
exception
  when others then null;
end $$;
