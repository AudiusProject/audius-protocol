BEGIN;
DO $$ BEGIN
-- Prod gate so migration doesn't run on stage or dev
IF EXISTS (SELECT * FROM "blocks" WHERE "blockhash" = '0x6d85ed08b546d192e0342efbf6e8007d449cb4c32a05a0fe27f19a475ab32127') THEN
  -- Uniques 
  UPDATE aggregate_daily_unique_users_metrics
  SET summed_count = 117960, count = 77208
  WHERE timestamp = '2024-01-25';

  UPDATE aggregate_daily_unique_users_metrics
  SET summed_count = 119635, count = 77431
  WHERE timestamp = '2024-01-26';

  UPDATE aggregate_daily_unique_users_metrics
  SET summed_count = 121309, count = 77654
  WHERE timestamp = '2024-01-27';

  UPDATE aggregate_daily_unique_users_metrics
  SET summed_count = 122983, count = 77877
  WHERE timestamp = '2024-01-28';

  UPDATE aggregate_daily_unique_users_metrics
  SET summed_count = 124658, count = 78100
  WHERE timestamp = '2024-01-29';

  -- Totals
  UPDATE aggregate_daily_total_users_metrics
  SET count = 3171019
  WHERE timestamp = '2024-01-25';

  UPDATE aggregate_daily_total_users_metrics
  SET count = 3196963
  WHERE timestamp = '2024-01-26';

  UPDATE aggregate_daily_total_users_metrics
  SET count = 3222907
  WHERE timestamp = '2024-01-27';

  UPDATE aggregate_daily_total_users_metrics
  SET count = 3248851
  WHERE timestamp = '2024-01-28';

  UPDATE aggregate_daily_total_users_metrics
  SET count = 3274795
  WHERE timestamp = '2024-01-29';
END IF;
END $$;
COMMIT;
