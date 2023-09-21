-- tracks where is_premium == false should have premium_conditions == null
begin;
update tracks set premium_conditions = null where track_id in (
  select track_id from (
    select * from tracks where premium_conditions is not null and is_current is true
  ) pt where pt.is_premium is false and pt.is_current is true
) and is_current is true;
commit;
