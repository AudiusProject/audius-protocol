begin;

update tracks set bpm = 79.4, musical_key = 'g major' where audio_upload_id = 'test-f00cd64b-4030-4b58-bb5c-ae3af7c5c516';
update tracks set bpm = 116.1, musical_key = 'b major' where audio_upload_id = 'test-77707716-33dc-4a0b-8d23-2cab7144681e';
update tracks set bpm = 95, musical_key = 'f major' where audio_upload_id = 'test-7828f5cd-412c-4ded-a28f-f08f8d4b8d7f';

commit;