-- Uniques 
UPDATE aggregate_daily_unique_users_metrics
SET summed_count = 180892, count = 86828
WHERE timestamp = '2023-06-22';

UPDATE aggregate_daily_unique_users_metrics
SET summed_count = 184110, count = 88372
WHERE timestamp = '2023-06-23';

UPDATE aggregate_daily_unique_users_metrics
SET summed_count = 186169, count = 89360
WHERE timestamp = '2023-06-24';

UPDATE aggregate_daily_unique_users_metrics
SET summed_count = 187113, count = 89814 
WHERE timestamp = '2023-06-25';

-- Totals
UPDATE aggregate_daily_total_users_metrics
SET count = 6066291
WHERE timestamp = '2023-06-22';

UPDATE aggregate_daily_total_users_metrics
SET count = 9116988
WHERE timestamp = '2023-06-23';

UPDATE aggregate_daily_total_users_metrics
SET count = 8247462
WHERE timestamp = '2023-06-24';

UPDATE aggregate_daily_total_users_metrics
SET count = 6101779
WHERE timestamp = '2023-06-25';