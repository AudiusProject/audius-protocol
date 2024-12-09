begin;

update tracks set bpm = 100.000000, musical_key = 'g major' where audio_upload_id = 'test-b4db0fef-9138-4e09-9024-6dc64b41f1c5';
update tracks set bpm = 120.000000, musical_key = 'b major' where audio_upload_id = 'test-876c0950-97c5-4638-9fc6-132c69a8fd3b';
update tracks set bpm = 74.000000, musical_key = 'f major' where audio_upload_id = 'test-24ad7f49-0361-4612-99a0-69e703f9af97';

commit;