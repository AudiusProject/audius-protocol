begin;

alter table tracks drop column if exists is_stream_gated;
alter table tracks drop column if exists is_download_gated;

commit;
