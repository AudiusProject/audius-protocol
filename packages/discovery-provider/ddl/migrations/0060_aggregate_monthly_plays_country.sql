begin;

alter table aggregate_monthly_plays add column if not exists country text not null default '';

ALTER TABLE aggregate_monthly_plays DROP CONSTRAINT aggregate_monthly_plays_pkey;

ALTER TABLE aggregate_monthly_plays ADD PRIMARY KEY (play_item_id, "timestamp", country);

commit;
