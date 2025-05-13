BEGIN;

CREATE TABLE IF NOT EXISTS public.playlist_trending_scores (
    playlist_id integer NOT NULL,
    type character varying NOT NULL,
    version character varying NOT NULL,
    time_range character varying NOT NULL,
    score double precision NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (playlist_id, type, version, time_range)
);

CREATE INDEX IF NOT EXISTS ix_playlist_trending_scores_playlist_id ON public.playlist_trending_scores USING btree (playlist_id);

COMMIT;