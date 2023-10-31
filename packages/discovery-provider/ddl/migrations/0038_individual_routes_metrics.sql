BEGIN;

ALTER TABLE aggregate_daily_total_users_metrics ADD IF NOT EXISTS personal_count integer;
ALTER TABLE aggregate_daily_unique_users_metrics ADD IF NOT EXISTS personal_count integer;
ALTER TABLE aggregate_monthly_total_users_metrics ADD IF NOT EXISTS personal_count integer;
ALTER TABLE aggregate_monthly_unique_users_metrics ADD IF NOT EXISTS personal_count integer;

COMMIT;
