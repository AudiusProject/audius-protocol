begin;

alter table tracks add column if not exists bpm float; 
alter table tracks add column if not exists musical_key character varying;
alter table tracks add column if not exists audio_analysis_error_count integer not null default 0;

update tracks set audio_analysis_error_count = 0 where audio_analysis_error_count is null;

commit;
