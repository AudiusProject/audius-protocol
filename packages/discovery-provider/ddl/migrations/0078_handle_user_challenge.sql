create or replace function handle_on_user_challenge() returns trigger as $$
declare
  reward_manager_tx reward_manager_txs%rowtype;
begin

    -- check if the user_challenge row has is_complete set to true
    if (new.is_complete = true) then
        -- attempt to insert a new notification, ignoring conflicts
        insert into notification
        (blocknumber, user_ids, timestamp, type, group_id, specifier, data)
        values
        (
            new.blocknumber,
            ARRAY [new.user_id],
            new.completed_at,
            'challenge_completed',
            'challenge_completed:' || new.user_id || ':challenge:' || new.challenge_id || ':specifier:' || new.specifier,
            new.specifier,
            json_build_object('specifier', new.specifier, 'challenge_id', new.challenge_id, 'amount', new.amount)
        )
        on conflict do nothing;
    end if;

    return new;

end;
$$ language plpgsql;


do $$ begin
  create trigger on_user_challenge
    after insert or update on user_challenge
    for each row execute procedure handle_on_user_challenge();
exception
  when others then null;
end $$;
