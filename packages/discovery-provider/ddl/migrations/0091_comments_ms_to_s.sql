begin;

alter table comments rename column track_timestamp_ms to track_timestamp_s;

commit;
