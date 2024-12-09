begin;

update tracks set bpm = 100.000000, musical_key = 'g major' where audio_upload_id = 'test-d3a20fb3-d9f1-4ed1-9360-755c0a01a78d';

commit;