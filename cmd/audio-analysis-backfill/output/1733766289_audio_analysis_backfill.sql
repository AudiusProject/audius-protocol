begin;

update tracks set bpm = 100, musical_key = 'g major' where audio_upload_id = 'test-8978e8c3-9877-4536-b876-301477382787';
update tracks set bpm = 120, musical_key = 'b major' where audio_upload_id = 'test-24bb9f6f-090c-4471-8caf-6f70ecf7bf6e';
update tracks set bpm = 74, musical_key = 'f major' where audio_upload_id = 'test-bc26c3cd-5f9c-4823-88d1-22aca90d7b87';

commit;