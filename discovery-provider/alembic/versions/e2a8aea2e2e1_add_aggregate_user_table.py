"""Add aggregate user table

Revision ID: e2a8aea2e2e1
Revises: 92571f94989a
Create Date: 2021-10-14 19:38:41.776025

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "e2a8aea2e2e1"
down_revision = "92571f94989a"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE TABLE aggregate_user_table AS TABLE aggregate_user")
    op.execute("ALTER TABLE aggregate_user_table ADD PRIMARY KEY (user_id)")
    op.execute("DROP MATERIALIZED VIEW aggregate_user CASCADE")

    op.execute("ALTER TABLE aggregate_user_table RENAME TO aggregate_user")

    op.execute(
        """
        DROP MATERIALIZED VIEW IF EXISTS trending_params;

        CREATE MATERIALIZED VIEW trending_params as
        SELECT
            t.track_id as track_id,
            t.genre as genre,
            t.owner_id as owner_id,
            ap.play_count as play_count,
            au.follower_count as owner_follower_count,
            COALESCE (aggregate_track.repost_count, 0) as repost_count,
            COALESCE (aggregate_track.save_count, 0) as save_count,
            COALESCE (repost_week.repost_count, 0) as repost_week_count,
            COALESCE (repost_month.repost_count, 0) as repost_month_count,
            COALESCE (repost_year.repost_count, 0) as repost_year_count,
            COALESCE (save_week.repost_count, 0) as save_week_count,
            COALESCE (save_month.repost_count, 0) as save_month_count,
            COALESCE (save_year.repost_count, 0) as save_year_count,
            COALESCE (karma.karma, 0) as karma
        FROM
            tracks t
        -- join on subquery for aggregate play count
        LEFT OUTER JOIN (
            SELECT
                ap.count as play_count,
                ap.play_item_id as play_item_id
            FROM
                aggregate_plays ap
        ) as ap ON ap.play_item_id = t.track_id
        -- join on subquery for aggregate user
        LEFT OUTER JOIN (
            SELECT
                au.user_id as user_id,
                au.follower_count as follower_count
            FROM
                aggregate_user au
        ) as au ON au.user_id = t.owner_id
        -- join on subquery for aggregate track
        LEFT OUTER JOIN (
            SELECT
                aggregate_track.track_id as track_id,
                aggregate_track.repost_count as repost_count,
                aggregate_track.save_count as save_count
            FROM
                aggregate_track
        ) as aggregate_track ON aggregate_track.track_id = t.track_id
        -- -- join on subquery for reposts by year
        LEFT OUTER JOIN (
            SELECT
                r.repost_item_id as track_id,
                count(r.repost_item_id) as repost_count
            FROM
                reposts r
            WHERE
                r.is_current is True AND
                r.repost_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 year')
            GROUP BY r.repost_item_id
        ) repost_year ON repost_year.track_id = t.track_id
        -- -- join on subquery for reposts by month
        LEFT OUTER JOIN (
            SELECT
                r.repost_item_id as track_id,
                count(r.repost_item_id) as repost_count
            FROM
                reposts r
            WHERE
                r.is_current is True AND
                r.repost_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 month')
            GROUP BY r.repost_item_id
        ) repost_month ON repost_month.track_id = t.track_id
        -- -- join on subquery for reposts by week
        LEFT OUTER JOIN (
            SELECT
                r.repost_item_id as track_id,
                count(r.repost_item_id) as repost_count
            FROM
                reposts r
            WHERE
                r.is_current is True AND
                r.repost_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 week')
            GROUP BY r.repost_item_id
        ) repost_week ON repost_week.track_id = t.track_id
        -- -- join on subquery for saves by year
        LEFT OUTER JOIN (
            SELECT
                r.save_item_id as track_id,
                count(r.save_item_id) as repost_count
            FROM
                saves r
            WHERE
                r.is_current is True AND
                r.save_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 year')
            GROUP BY r.save_item_id
        ) save_year ON save_year.track_id = t.track_id
        -- -- join on subquery for saves by month
        LEFT OUTER JOIN (
            SELECT
                r.save_item_id as track_id,
                count(r.save_item_id) as repost_count
            FROM
                saves r
            WHERE
                r.is_current is True AND
                r.save_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 month')
            GROUP BY r.save_item_id
        ) save_month ON save_month.track_id = t.track_id
        -- -- join on subquery for saves by week
        LEFT OUTER JOIN (
            SELECT
                r.save_item_id as track_id,
                count(r.save_item_id) as repost_count
            FROM
                saves r
            WHERE
                r.is_current is True AND
                r.save_type = 'track' AND
                r.is_delete is False AND
                r.created_at > (now() - interval '1 week')
            GROUP BY r.save_item_id
        ) save_week ON save_week.track_id = t.track_id
        LEFT OUTER JOIN (
            SELECT
                save_and_reposts.item_id as track_id,
                sum(au.follower_count) as karma
            FROM
                (
                    select
                        r_and_s.user_id,
                        r_and_s.item_id
                    from
                        (select
                            user_id,
                            repost_item_id as item_id
                        from
                            reposts
                        where
                            is_delete is false AND
                            is_current is true AND
                            repost_type = 'track'
                        union all
                        select
                            user_id,
                            save_item_id as item_id
                        from
                            saves
                        where
                            is_delete is false AND
                            is_current is true AND
                            save_type = 'track'
                        ) r_and_s
                    join
                        users
                    on r_and_s.user_id = users.user_id
                    where
                        users.cover_photo is not null AND
                        users.profile_picture is not null AND
                        users.bio is not null
                ) save_and_reposts
            JOIN
                aggregate_user au
            ON
                save_and_reposts.user_id = au.user_id
            GROUP BY save_and_reposts.item_id
        ) karma ON karma.track_id = t.track_id
        WHERE
            t.is_current is True AND
            t.is_delete is False AND
            t.is_unlisted is False AND
            t.stem_of is Null;

        CREATE INDEX trending_params_track_id_idx ON trending_params (track_id);"""
    )

    op.execute(
        """
        DROP MATERIALIZED VIEW IF EXISTS user_lexeme_dict;
        DROP INDEX IF EXISTS user_words_idx;

        CREATE MATERIALIZED VIEW user_lexeme_dict as
        SELECT row_number() OVER (PARTITION BY true), * FROM (
            SELECT
                u.user_id,
                lower(u.name) as user_name,
                lower(u.handle) as handle,
                a.follower_count as follower_count,
                unnest(
                    tsvector_to_array(
                        to_tsvector(
                            'audius_ts_config',
                            replace(COALESCE(u.name, ''), '&', 'and')
                        ) ||
                        to_tsvector(
                            'audius_ts_config',
                            COALESCE(u.handle, '')
                        )
                    )
                ) as word
            FROM
                users u
            INNER JOIN aggregate_user a on a.user_id = u.user_id
            WHERE u.is_current = true and
            u.user_id not in (
                select u.user_id from users u
                inner join
                    (
                        select distinct lower(u1.handle) as handle, u1.user_id from users u1
                        where u1.is_current = true and u1.is_verified = true
                    ) as sq
                on lower(u.name) = sq.handle and u.user_id != sq.user_id
                where u.is_current = true
            )
            GROUP BY u.user_id, u.name, u.handle, a.follower_count
        ) AS words;

        CREATE INDEX user_words_idx ON user_lexeme_dict USING gin(word gin_trgm_ops);
        CREATE INDEX user_handles_idx ON user_lexeme_dict(handle);
        CREATE UNIQUE INDEX user_row_number_idx ON user_lexeme_dict(row_number);

        DROP MATERIALIZED VIEW IF EXISTS track_lexeme_dict;
        DROP INDEX IF EXISTS track_words_idx;

        CREATE MATERIALIZED VIEW track_lexeme_dict as
        SELECT row_number() OVER (PARTITION BY true), * FROM (
            SELECT
                t.track_id,
                t.owner_id as owner_id,
                lower(t.title) as track_title,
                lower(u.handle) as handle,
                lower(u.name) as user_name,
                a.repost_count as repost_count,
                unnest(
                    tsvector_to_array(
                        to_tsvector(
                            'audius_ts_config',
                            replace(COALESCE(t."title", ''), '&', 'and')
                        )
                    )
                ) as word
            FROM
                tracks t
            INNER JOIN users u ON t.owner_id = u.user_id
            INNER JOIN aggregate_track a on a.track_id = t.track_id
            WHERE t.is_current = true AND t.is_unlisted = false AND t.is_delete = false AND t.stem_of IS NULL AND u.is_current = true and
            u.user_id not in (
                select u.user_id from users u
                inner join
                    (
                        select distinct lower(u1.handle) as handle, u1.user_id from users u1
                        where u1.is_current = true and u1.is_verified = true
                    ) as sq
                on lower(u.name) = sq.handle and u.user_id != sq.user_id
                where u.is_current = true
            )
            GROUP BY t.track_id, t.title, t.owner_id, u.handle, u.name, a.repost_count
        ) AS words;

        CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);
        CREATE INDEX track_user_name_idx ON track_lexeme_dict USING gin(user_name gin_trgm_ops);
        CREATE INDEX tracks_user_handle_idx ON track_lexeme_dict(handle);
        CREATE UNIQUE INDEX track_row_number_idx ON track_lexeme_dict(row_number);

        DROP MATERIALIZED VIEW IF EXISTS playlist_lexeme_dict;
        DROP MATERIALIZED VIEW IF EXISTS album_lexeme_dict;
        DROP INDEX IF EXISTS playlist_words_idx;
        DROP INDEX IF EXISTS album_words_idx;

        CREATE MATERIALIZED VIEW playlist_lexeme_dict as
        SELECT row_number() OVER (PARTITION BY true), * FROM (
            SELECT
                p.playlist_id,
                lower(p.playlist_name) as playlist_name,
                p.playlist_owner_id as owner_id,
                lower(u.handle) as handle,
                lower(u.name) as user_name,
                a.repost_count as repost_count,
                unnest(
                    tsvector_to_array(
                        to_tsvector(
                            'audius_ts_config',
                            replace(COALESCE(p.playlist_name, ''), '&', 'and')
                        )
                    )
                ) as word
            FROM
                    playlists p
            INNER JOIN users u ON p.playlist_owner_id = u.user_id
            INNER JOIN aggregate_playlist a on a.playlist_id = p.playlist_id
            WHERE
                    p.is_current = true and p.is_album = false and p.is_private = false and p.is_delete = false
                    and u.is_current = true and
                    u.user_id not in (
                        select u.user_id from users u
                        inner join
                            (
                                select distinct lower(u1.handle) as handle, u1.user_id from users u1
                                where u1.is_current = true and u1.is_verified = true
                            ) as sq
                        on lower(u.name) = sq.handle and u.user_id != sq.user_id
                        where u.is_current = true
                    )
            GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count
        ) AS words;

        CREATE MATERIALIZED VIEW album_lexeme_dict as
        SELECT row_number() OVER (PARTITION BY true), * FROM (
            SELECT
                p.playlist_id,
                lower(p.playlist_name) as playlist_name,
                p.playlist_owner_id as owner_id,
                lower(u.handle) as handle,
                lower(u.name) as user_name,
                a.repost_count as repost_count,
                unnest(
                    tsvector_to_array(
                        to_tsvector(
                            'audius_ts_config',
                            replace(COALESCE(p.playlist_name, ''), '&', 'and')
                        )
                    )
                ) as word
            FROM
                    playlists p
            INNER JOIN users u ON p.playlist_owner_id = u.user_id
            INNER JOIN aggregate_playlist a on a.playlist_id = p.playlist_id
            WHERE
                    p.is_current = true and p.is_album = true and p.is_private = false and p.is_delete = false
                    and u.is_current = true and
                    u.user_id not in (
                        select u.user_id from users u
                        inner join
                            (
                                select distinct lower(u1.handle) as handle, u1.user_id from users u1
                                where u1.is_current = true and u1.is_verified = true
                            ) as sq
                        on lower(u.name) = sq.handle and u.user_id != sq.user_id
                        where u.is_current = true
                    )
            GROUP BY p.playlist_id, p.playlist_name, p.playlist_owner_id, u.handle, u.name, a.repost_count
        ) AS words;

        CREATE INDEX playlist_words_idx ON playlist_lexeme_dict USING gin(word gin_trgm_ops);
        CREATE INDEX playlist_user_name_idx ON playlist_lexeme_dict USING gin(user_name gin_trgm_ops);
        CREATE INDEX playlist_user_handle_idx ON playlist_lexeme_dict(handle);
        CREATE UNIQUE INDEX playlist_row_number_idx ON playlist_lexeme_dict(row_number);

        CREATE INDEX album_words_idx ON album_lexeme_dict USING gin(word gin_trgm_ops);
        CREATE INDEX album_user_name_idx ON album_lexeme_dict USING gin(user_name gin_trgm_ops);
        CREATE INDEX album_user_handle_idx ON album_lexeme_dict(handle);
        CREATE UNIQUE INDEX album_row_number_idx ON album_lexeme_dict(row_number);
        """
    )


def downgrade():
    op.execute(
        "CREATE MATERIALIZED VIEW aggregate_user_view AS SELECT * FROM aggregate_user"
    )
    op.drop_table("aggregate_user")
    op.execute("ALTER MATERIALIZED VIEW aggregate_user_view RENAME TO aggregate_user")
