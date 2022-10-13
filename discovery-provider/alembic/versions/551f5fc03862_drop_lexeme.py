"""drop lexeme

Revision ID: 551f5fc03862
Revises: 5d3f95470222
Create Date: 2022-08-23 15:48:14.787788

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "551f5fc03862"
down_revision = "5d3f95470222"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """

        drop materialized view if exists track_lexeme_dict;
        drop materialized view if exists user_lexeme_dict;
        drop materialized view if exists playlist_lexeme_dict;
        drop materialized view if exists album_lexeme_dict;

        """
        )
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
CREATE MATERIALIZED VIEW album_lexeme_dict AS
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
          ;

CREATE MATERIALIZED VIEW playlist_lexeme_dict AS
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
          ;

CREATE MATERIALIZED VIEW track_lexeme_dict AS
 SELECT row_number() OVER (PARTITION BY true::boolean) AS row_number,
    words.track_id,
    words.owner_id,
    words.track_title,
    words.handle,
    words.user_name,
    words.repost_count,
    words.word
   FROM ( SELECT t.track_id,
            t.owner_id,
            lower(t.title) AS track_title,
            lower((u.handle)::text) AS handle,
            lower(u.name) AS user_name,
            a.repost_count,
            unnest((tsvector_to_array(to_tsvector('public.audius_ts_config'::regconfig, replace(COALESCE(t.title, ''::text), '&'::text, 'and'::text))) || lower(COALESCE(t.title, ''::text)))) AS word
           FROM ((public.tracks t
             JOIN public.users u ON ((t.owner_id = u.user_id)))
             JOIN public.aggregate_track a ON ((a.track_id = t.track_id)))
          WHERE ((t.is_current = true) AND (t.is_unlisted = false) AND (t.is_delete = false) AND (t.stem_of IS NULL) AND (u.is_current = true) AND (NOT (u.user_id IN ( SELECT u_1.user_id
                   FROM (public.users u_1
                     JOIN ( SELECT DISTINCT lower((u1.handle)::text) AS handle,
                            u1.user_id
                           FROM public.users u1
                          WHERE ((u1.is_current = true) AND (u1.is_verified = true))) sq ON (((lower(u_1.name) = sq.handle) AND (u_1.user_id <> sq.user_id))))
                  WHERE (u_1.is_current = true)))))
          GROUP BY t.track_id, t.title, t.owner_id, u.handle, u.name, a.repost_count) words
          ;

CREATE MATERIALIZED VIEW user_lexeme_dict AS
 SELECT row_number() OVER (PARTITION BY true::boolean) AS row_number,
    words.user_id,
    words.user_name,
    words.handle,
    words.follower_count,
    words.word
   FROM ( SELECT u.user_id,
            lower(u.name) AS user_name,
            lower((u.handle)::text) AS handle,
            a.follower_count,
            unnest((tsvector_to_array((to_tsvector('public.audius_ts_config'::regconfig, replace(COALESCE(u.name, ''::text), '&'::text, 'and'::text)) || to_tsvector('public.audius_ts_config'::regconfig, (COALESCE(u.handle, ''::character varying))::text))) || lower(COALESCE(u.name, ''::text)))) AS word
           FROM (public.users u
             JOIN public.aggregate_user a ON ((a.user_id = u.user_id)))
          WHERE ((u.is_current = true) AND (NOT (u.user_id IN ( SELECT u_1.user_id
                   FROM (public.users u_1
                     JOIN ( SELECT DISTINCT lower((u1.handle)::text) AS handle,
                            u1.user_id
                           FROM public.users u1
                          WHERE ((u1.is_current = true) AND (u1.is_verified = true))) sq ON (((lower(u_1.name) = sq.handle) AND (u_1.user_id <> sq.user_id))))
                  WHERE (u_1.is_current = true)))))
          GROUP BY u.user_id, u.name, u.handle, a.follower_count) words
          ;

        """
        )
    )
