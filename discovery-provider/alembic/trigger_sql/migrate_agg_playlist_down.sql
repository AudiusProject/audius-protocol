
do $$ begin
  drop table if exists aggregate_playlist cascade;
exception
  when others then null;
end $$;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.aggregate_playlist AS
 SELECT p.playlist_id,
    p.is_album,
    COALESCE(playlist_repost.repost_count, (0)::bigint) AS repost_count,
    COALESCE(playlist_save.save_count, (0)::bigint) AS save_count
   FROM ((public.playlists p
     LEFT JOIN ( SELECT r.repost_item_id AS playlist_id,
            count(r.repost_item_id) AS repost_count
           FROM public.reposts r
          WHERE ((r.is_current IS TRUE) AND ((r.repost_type = 'playlist'::public.reposttype) OR (r.repost_type = 'album'::public.reposttype)) AND (r.is_delete IS FALSE))
          GROUP BY r.repost_item_id) playlist_repost ON ((playlist_repost.playlist_id = p.playlist_id)))
     LEFT JOIN ( SELECT s.save_item_id AS playlist_id,
            count(s.save_item_id) AS save_count
           FROM public.saves s
          WHERE ((s.is_current IS TRUE) AND ((s.save_type = 'playlist'::public.savetype) OR (s.save_type = 'album'::public.savetype)) AND (s.is_delete IS FALSE))
          GROUP BY s.save_item_id) playlist_save ON ((playlist_save.playlist_id = p.playlist_id)))
  WHERE ((p.is_current IS TRUE) AND (p.is_delete IS FALSE))
  WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS  aggregate_playlist_idx ON public.aggregate_playlist USING btree (playlist_id);