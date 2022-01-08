"""fix_trending_karma

Revision ID: be27a2794f75
Revises: 132955202f03
Create Date: 2022-01-08 00:13:16.651769

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "be27a2794f75"
down_revision = "132955202f03"
branch_labels = None
depends_on = None


def upgrade():
    # This revision copies 6b5186e7d28f and replaces trending_params with a fixed version
    conn = op.get_bind()
    query = """
        DO
        $do$
        BEGIN
            ALTER MATERIALIZED VIEW trending_params RENAME TO trending_params_aSPET;
            ALTER INDEX trending_params_track_id_idx RENAME TO trending_params_track_id_idx_aSPET;

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
                            (
                                users.cover_photo is not null OR
                                users.cover_photo_sizes is not null
                            ) AND
                            (
                                users.profile_picture is not null OR
                                users.profile_picture_sizes is not null
                            ) AND
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

            CREATE INDEX trending_params_track_id_idx ON trending_params (track_id);
        END
        $do$
        """

    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
        begin;
            DROP MATERIALIZED VIEW trending_params;
            ALTER MATERIALIZED VIEW trending_params_aSPET RENAME to trending_params;
        commit;
    """
    conn.execute(query)
