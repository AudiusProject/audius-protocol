begin;

-- disable triggers
alter table tracks disable trigger on_track;
alter table tracks disable trigger trg_tracks;

-- rename columns
alter table tracks rename column is_premium to is_stream_gated;
alter table tracks rename column premium_conditions to stream_conditions;

-- re-enable triggers
alter table tracks enable trigger on_track;
alter table tracks enable trigger trg_tracks;

commit;
