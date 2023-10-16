create or replace function handle_supporter_rank_up() returns trigger as $$
declare
  user_bank_tx user_bank_txs%ROWTYPE;
  dethroned_user_id int;
begin
  select * into user_bank_tx from user_bank_txs where user_bank_txs.slot = new.slot limit 1;

  if user_bank_tx is not null then
    -- create a notification for the sender and receiver
    insert into notification
      (slot, user_ids, timestamp, type, specifier, group_id, data, type_v2)
    values
      (
      -- supporting_rank_up notifs are sent to the sender of the tip
        new.slot,
        ARRAY [new.sender_user_id],
        user_bank_tx.created_at,
        'supporting_rank_up',
        new.sender_user_id,
        'supporting_rank_up:' || new.rank || ':slot:' || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank),
        'supporting_rank_up'
      ),
      (
      -- supporter_rank_up notifs are sent to the receiver of the tip
        new.slot,
        ARRAY [new.receiver_user_id],
        user_bank_tx.created_at,
        'supporter_rank_up',
        new.receiver_user_id,
        'supporter_rank_up:' || new.rank || ':slot:' || new.slot,
        json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'rank', new.rank),
        'supporter_rank_up'
      )
    on conflict do nothing;

    if new.rank = 1 then
      select sender_user_id into dethroned_user_id from supporter_rank_ups where rank=1 and receiver_user_id=new.receiver_user_id and slot < new.slot order by slot desc limit 1;
      if dethroned_user_id is not NULL then
        -- create a notification for the sender and receiver
        insert into notification
          (slot, user_ids, timestamp, type, specifier, group_id, data, type_v2)
        values
          (
            new.slot,
            ARRAY [dethroned_user_id],
            user_bank_tx.created_at,
            'supporter_dethroned',
            new.sender_user_id,
            'supporter_dethroned:receiver_user_id:' || new.receiver_user_id || ':slot:' || new.slot,
            json_build_object('sender_user_id', new.sender_user_id, 'receiver_user_id', new.receiver_user_id, 'dethroned_user_id', dethroned_user_id),
            'supporter_dethroned'
          ) on conflict do nothing;

      end if;
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
  create trigger on_supporter_rank_up
    after insert on supporter_rank_ups
    for each row execute procedure handle_supporter_rank_up();
exception
  when others then null;
end $$;
