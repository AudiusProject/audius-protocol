begin;

-- find potentially old countries:
-- select distinct country from aggregate_monthly_plays where country not in (select nicename from countries);

-- fix 'Netherlands' rows to 'The Netherlands'
insert into aggregate_monthly_plays (play_item_id, timestamp, count, country)
select play_item_id, timestamp, count, 'The Netherlands'
from aggregate_monthly_plays where country = 'Netherlands'
on conflict (play_item_id, "timestamp", country)
do update set count = aggregate_monthly_plays.count + excluded.count
;

-- delete old 'Netherlands' rows
delete from aggregate_monthly_plays where country = 'Netherlands';

commit;
