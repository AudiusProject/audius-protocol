begin;

alter table tracks
add column if not exists preview_cid character varying,
add column if not exists audio_upload_id character varying,
add column if not exists preview_start_seconds float;

create index tracks_preview_cid_idx on public.tracks using btree (preview_cid, is_current, is_delete);

commit;
