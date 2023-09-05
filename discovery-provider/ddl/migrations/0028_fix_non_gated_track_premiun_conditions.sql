-- tracks where is_premium == false should have premium_conditions == null
begin;
update tracks set premium_conditions = null where is_premium = false;
commit;
