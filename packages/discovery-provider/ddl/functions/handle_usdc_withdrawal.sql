create or replace function handle_usdc_withdrawal() returns trigger as $$
DECLARE
    users_row users%ROWTYPE;
    notification_type varchar;
begin

  if new.transaction_type in ('transfer', 'withdrawal') and new.method = 'send' then
    notification_type := 'usdc_' || new.transaction_type;
    -- Fetch the corresponding user based on the wallet
    select into users_row users.*
    from users
    join usdc_user_bank_accounts
      on users.wallet = usdc_user_bank_accounts.ethereum_address
    where usdc_user_bank_accounts.bank_account = new.user_bank;

    -- Insert the new notification
    insert into notification
      (slot, user_ids, timestamp, type, specifier, group_id, data)
    values
      (
        new.slot,
        ARRAY [users_row.user_id],
        new.created_at,
        notification_type,
        users_row.user_id,
        notification_type || ':' || users_row.user_id || ':' || 'signature:' || new.signature,
        json_build_object(
          'user_id', users_row.user_id,
          'user_bank', new.user_bank,
          'signature', new.signature,
          'change', new.change,
          'balance', new.balance,
          'receiver_account', new.tx_metadata
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
