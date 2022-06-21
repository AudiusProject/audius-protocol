-- recreate dropped search matviews



CREATE MATERIALIZED VIEW IF NOT EXISTS public.playlist_lexeme_dict AS
 SELECT row_number() OVER (PARTITION BY true::boolean) AS row_number,
    words.playlist_id,
    words.playlist_name,
    words.owner_id,
    words.handle,
    words.user_name,
    words.repost_count,
    words.word
   FROM ( SELECT p.playlist_id,
            lower((p.playlist_name)::text) AS playlist_name,
            p.playlist_owner_id AS owner_id,
            lower((u.handle)::text) AS handle,
            lower(u.name) AS user_name,
            a.repost_count,
            unnest((tsvector_to_array(to_tsvector('public.audius_ts_config'::regconfig, replace((COALESCE(p.playlist_name, ''::character varying))::text, '&'::text, 'and'::text))) || lower((COALESCE(p.playlist_name, ''::character varying))::text))) AS word
           FROM ((public.playlists p
             JOIN public.users u ON ((p.playlist_owner_id = u.user_id)))
             JOIN public.aggregate_playlist a ON ((a.playlist_id = p.playlist_id)))
          WHERE ((p.is_current = true) AND (p.is_album = false) AND (p.is_private = false) AND (p.is_delete = false) AND (u.is_current = true) AND (NOT (u.user_id IN ( SELECT u_1.user_id
                   FROM (public.users u_1
                     JOIN ( SELECT DISTINCT lower((u1.handle)::text) AS handle,
                            u1.user_id
                           FROM public.users u1
                          WHERE ((u1.is_current = true) AND (u1.is_verified = true))) sq ON (((lower(u_1.name) = sq.handle) AND (u_1.user_id <> sq.user_id))))
                  WHERE (u_1.is_current = true)))))
          GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count) words
  WITH NO DATA;


CREATE UNIQUE INDEX IF NOT EXISTS playlist_row_number_idx ON public.playlist_lexeme_dict USING btree (row_number);
CREATE INDEX IF NOT EXISTS playlist_user_handle_idx ON public.playlist_lexeme_dict USING btree (handle);
CREATE INDEX IF NOT EXISTS playlist_user_name_idx ON public.playlist_lexeme_dict USING gin (user_name public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS playlist_words_idx ON public.playlist_lexeme_dict USING gin (word public.gin_trgm_ops);




CREATE MATERIALIZED VIEW IF NOT EXISTS public.album_lexeme_dict AS
 SELECT row_number() OVER (PARTITION BY true::boolean) AS row_number,
    words.playlist_id,
    words.playlist_name,
    words.owner_id,
    words.handle,
    words.user_name,
    words.repost_count,
    words.word
   FROM ( SELECT p.playlist_id,
            lower((p.playlist_name)::text) AS playlist_name,
            p.playlist_owner_id AS owner_id,
            lower((u.handle)::text) AS handle,
            lower(u.name) AS user_name,
            a.repost_count,
            unnest((tsvector_to_array(to_tsvector('public.audius_ts_config'::regconfig, replace((COALESCE(p.playlist_name, ''::character varying))::text, '&'::text, 'and'::text))) || lower((COALESCE(p.playlist_name, ''::character varying))::text))) AS word
           FROM ((public.playlists p
             JOIN public.users u ON ((p.playlist_owner_id = u.user_id)))
             JOIN public.aggregate_playlist a ON ((a.playlist_id = p.playlist_id)))
          WHERE ((p.is_current = true) AND (p.is_album = true) AND (p.is_private = false) AND (p.is_delete = false) AND (u.is_current = true) AND (NOT (u.user_id IN ( SELECT u_1.user_id
                   FROM (public.users u_1
                     JOIN ( SELECT DISTINCT lower((u1.handle)::text) AS handle,
                            u1.user_id
                           FROM public.users u1
                          WHERE ((u1.is_current = true) AND (u1.is_verified = true))) sq ON (((lower(u_1.name) = sq.handle) AND (u_1.user_id <> sq.user_id))))
                  WHERE (u_1.is_current = true)))))
          GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count) words
  WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS album_row_number_idx ON public.album_lexeme_dict USING btree (row_number);
CREATE INDEX IF NOT EXISTS album_user_handle_idx ON public.album_lexeme_dict USING btree (handle);
CREATE INDEX IF NOT EXISTS album_user_name_idx ON public.album_lexeme_dict USING gin (user_name public.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS album_words_idx ON public.album_lexeme_dict USING gin (word public.gin_trgm_ops);
