begin;

-- rename columns
alter table tracks rename column is_premium to is_stream_gated;
alter table tracks rename column premium_conditions to stream_conditions;

commit;
