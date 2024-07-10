begin;
    alter table playlists disable trigger on_playlist;
    alter table playlists disable trigger trg_playlists;


    alter table playlists
    add column if not exists is_scheduled_release boolean not null default false;
    alter table playlists
    add column if not exists release_date timestamp without time zone;

    alter table playlists enable trigger on_playlist;
    alter table playlists enable trigger trg_playlists;
commit;
