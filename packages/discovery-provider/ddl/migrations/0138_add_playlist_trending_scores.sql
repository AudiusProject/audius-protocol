BEGIN;

CREATE TABLE IF NOT EXISTS public.playlist_trending_scores (
    playlist_id integer NOT NULL,
    type character varying NOT NULL,
    version character varying NOT NULL,
    time_range character varying NOT NULL,
    score double precision NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'playlist_trending_scores_pkey'
        AND conrelid = 'public.playlist_trending_scores'::regclass
    ) THEN
        ALTER TABLE ONLY public.playlist_trending_scores
            ADD CONSTRAINT playlist_trending_scores_pkey PRIMARY KEY (playlist_id, type, version, time_range);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_playlist_trending_scores_playlist_id ON public.playlist_trending_scores USING btree (playlist_id);

COMMIT;