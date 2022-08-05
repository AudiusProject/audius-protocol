create or replace function handle_supporter_rank_up() returns trigger as $$
declare
  user_bank_tx user_bank_txs%ROWTYPE;
begin
  select * into user_bank_tx from user_bank_txs where user_bank_txs.slot = new.slot limit 1;

  if user_bank_tx is not null then
    -- create a notification for the sender and receiver
    insert into notification
      (slot, user_ids, timestamp, type, specifier, data)
    values
      (
        new.slot,
        ARRAY [new.sender_user_id],
        user_bank_tx.created_at,
        'supporter_rank_up',
        'supporter_rank_up:' || new.rank || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank)
      ),
      (
        new.slot,
        ARRAY [new.receiver_user_id],
        user_bank_tx.created_at,
        'supporting_rank_up',
        'supporting_rank_up:' || new.rank || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank)
      )
    on conflict do nothing;
  end if;
  return null;

exception
  when others then return null;
end;
$$ language plpgsql;


do $$ begin
  create trigger on_supporter_rank_up
    after insert on supporter_rank_ups
    for each row execute procedure handle_supporter_rank_up();
exception
  when others then null;
end $$;
