begin;

-- rename columns
alter table tracks rename column is_premium to is_stream_gated;
alter table tracks rename column premium_conditions to stream_conditions;

commit;

begin;
    alter table tracks disable trigger on_track;
    alter table tracks disable trigger trg_tracks;

    -- add has_stems column
    alter table tracks
    add column if not exists has_stems boolean not null default false;

    -- update has_stems column for tracks that have stems
    update tracks t set has_stems = true
    from (
        select track_id from tracks
        join stems
        on track_id = parent_track_id
        where is_current is true
    ) as parent_tracks
    where t.is_current is true
    and t.track_id = parent_tracks.track_id;

    alter table tracks enable trigger on_track;
    alter table tracks enable trigger trg_tracks;
commit;
