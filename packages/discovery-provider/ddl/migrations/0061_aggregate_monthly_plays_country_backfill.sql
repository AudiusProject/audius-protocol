begin;

with new_plays as (
    select
        play_item_id,
        date_trunc('month', created_at) as timestamp,
        coalesce(country, '') as country,
        count(play_item_id) as count
    from
        plays p
    where
        p.id < (select last_checkpoint from indexing_checkpoints where tablename = 'aggregate_monthly_plays')
    group by
        play_item_id, date_trunc('month', created_at), coalesce(country, '')
),
remove_old as (
    delete from aggregate_monthly_plays amp
    using new_plays np
    where amp.play_item_id = np.play_item_id
      and amp.timestamp = np.timestamp
)
insert into
    aggregate_monthly_plays (play_item_id, timestamp, country, count)
select
    new_plays.play_item_id,
    new_plays.timestamp,
    new_plays.country,
    new_plays.count
from
    new_plays on conflict (play_item_id, timestamp, country) do
update
set
    count = aggregate_monthly_plays.count + excluded.count
;

commit;