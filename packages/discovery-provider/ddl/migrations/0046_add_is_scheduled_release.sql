begin;
    alter table tracks disable trigger on_track;
    alter table tracks disable trigger trg_tracks;


    alter table tracks
    add column if not exists is_scheduled_release boolean not null default false;

    alter table tracks enable trigger on_track;
    alter table tracks enable trigger trg_tracks;
commit;
