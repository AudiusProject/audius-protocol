begin;

update uploads
set audio_analysis_status = 'error', audio_analysis_error_count = 5
where (audio_analysis_status is null or (audio_analysis_status != 'done' and audio_analysis_status != 'error')) and transcode_results::text = '{}';

update uploads set status = 'done' where status = 'audio_analysis' or status = 'busy_audio_analysis';

commit;
