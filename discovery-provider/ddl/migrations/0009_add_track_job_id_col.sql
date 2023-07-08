begin;

alter table tracks
add column if not exists audio_upload_id text,
add column if not exists preview_start_seconds float;

commit;
