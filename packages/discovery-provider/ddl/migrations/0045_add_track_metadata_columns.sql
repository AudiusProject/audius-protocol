begin;

-- add new columns
alter table tracks add column if not exists orig_file_cid varchar;
alter table tracks add column if not exists orig_filename varchar;
alter table tracks add column if not exists is_download_gated boolean not null default false;
alter table tracks add column if not exists download_conditions jsonb;
alter table tracks add column if not exists is_original_available boolean not null default false;

-- set default values for is_download_gated and download_conditions
-- based on if the track is usdc purchase gated
update tracks set is_download_gated = true where is_premium is true and (download->>'is_downloadable')::boolean is true;
update tracks set download_conditions = premium_conditions where is_premium is true and (download->>'is_downloadable')::boolean is true;

commit;
