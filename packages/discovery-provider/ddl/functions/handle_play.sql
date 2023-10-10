create or replace function handle_play() returns trigger as $$
declare
    new_listen_count int;
    milestone int;
    owner_user_id int;
begin

    insert into aggregate_plays (play_item_id, count) values (new.play_item_id, 0) on conflict do nothing;

    update aggregate_plays
        set count = count + 1 
        where play_item_id = new.play_item_id
        returning count into new_listen_count;

    select new_listen_count 
        into milestone 
        where new_listen_count in (10,25,50,100,250,500,1000,2500,5000,10000,25000,50000,100000,250000,500000,1000000);

    if milestone is not null then
        insert into milestones
            (id, name, threshold, slot, timestamp)
        values
            (new.play_item_id, 'LISTEN_COUNT', milestone, new.slot, new.created_at)
        on conflict do nothing;
        select tracks.owner_id into owner_user_id from tracks where is_current and track_id = new.play_item_id;
        if owner_user_id is not null then
            insert into notification
                (user_ids, specifier, group_id, type, slot, timestamp, data)
                values
                (
                    array[owner_user_id],
                    owner_user_id,
                    'milestone:LISTEN_COUNT:id:' || new.play_item_id || ':threshold:' || milestone,
                    'milestone',
                    new.slot,
                    new.created_at,
                    json_build_object('type', 'LISTEN_COUNT', 'track_id', new.play_item_id, 'threshold', milestone)
                )
            on conflict do nothing;
        end if;
    end if;
    return null;

exception
  when others then
    raise warning 'An error occurred in %: %', tg_name, sqlerrm;
    raise;

end;
$$ language plpgsql;

do $$ begin
    create trigger on_play
        after insert on plays
        for each row execute procedure handle_play();
exception
  when others then null;
end $$;

