"""add aggregate track table

Revision ID: dc7f691adc79
Revises: 3ea8467836d8
Create Date: 2022-01-20 18:21:40.504845

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "dc7f691adc79"
down_revision = "3ea8467836d8"
branch_labels = None
depends_on = None

CASCADING_SCHEMA = """
      begin;
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
                    ) || lower(COALESCE(t."title", ''))
                ) AS word
            FROM
                tracks t
            INNER JOIN users u ON t.owner_id = u.user_id
            INNER JOIN aggregate_track a ON a.track_id = t.track_id
            WHERE t.is_current = true AND t.is_unlisted = false AND t.is_delete = false AND t.stem_of IS NULL AND u.is_current = true AND
            u.user_id NOT IN (
          SELECT u.user_id FROM users u
          INNER JOIN
            (
              SELECT distinct lower(u1.handle) AS handle, u1.user_id FROM users u1
              WHERE u1.is_current = true AND u1.is_verified = true
            ) AS sq
          ON lower(u.name) = sq.handle AND u.user_id != sq.user_id
          WHERE u.is_current = true
        )
            GROUP BY t.track_id, t.title, t.owner_id, u.handle, u.name, a.repost_count
        ) AS words;

        CREATE INDEX track_words_idx ON track_lexeme_dict USING gin(word gin_trgm_ops);
        CREATE INDEX track_user_name_idx ON track_lexeme_dict USING gin(user_name gin_trgm_ops);
        CREATE INDEX tracks_user_handle_idx ON track_lexeme_dict(handle);
        CREATE UNIQUE INDEX track_row_number_idx ON track_lexeme_dict(row_number);

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

      commit;
    """


def upgrade():
    connection = op.get_bind()
    query = """
      DO
      $do$
      begin
        IF NOT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'aggregate_track'
        ) THEN
          DROP TABLE IF EXISTS aggregate_track_table;
          CREATE TABLE aggregate_track_table (
              track_id     integer NOT NULL UNIQUE PRIMARY KEY,
              repost_count integer NOT NULL,
              save_count   integer NOT NULL
          );
          DROP MATERIALIZED VIEW IF EXISTS aggregate_track CASCADE;
          ALTER TABLE aggregate_track_table RENAME TO aggregate_track;
          CREATE INDEX aggregate_track_idx ON aggregate_track (track_id);
        END IF;
      END
      $do$
    """

    connection.execute(query)
    connection.execute(CASCADING_SCHEMA)


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
      begin;
        DROP TABLE IF EXISTS aggregate_track;

        DROP MATERIALIZED VIEW IF EXISTS aggregate_track;
        DROP INDEX IF EXISTS aggregate_track_idx;

        CREATE MATERIALIZED VIEW aggregate_track as
        SELECT
          t.track_id,
          COALESCE (track_repost.repost_count, 0) as repost_count,
          COALESCE (track_save.save_count, 0) as save_count
        FROM 
          tracks t
        -- inner join on subquery for reposts
        LEFT OUTER JOIN (
          SELECT
            r.repost_item_id as track_id,
            count(r.repost_item_id) as repost_count
          FROM
            reposts r
          WHERE
            r.is_current is True AND
            r.repost_type = 'track' AND
            r.is_delete is False
          GROUP BY r.repost_item_id
        ) track_repost ON track_repost.track_id = t.track_id
        -- inner join on subquery for track saves
        LEFT OUTER JOIN (
          SELECT
            s.save_item_id as track_id,
            count(s.save_item_id) as save_count
          FROM
            saves s
          WHERE
            s.is_current is True AND
            s.save_type = 'track' AND
            s.is_delete is False
          GROUP BY s.save_item_id
        ) track_save ON track_save.track_id = t.track_id
        WHERE
          t.is_current is True AND
          t.is_delete is False;

        CREATE UNIQUE INDEX aggregate_track_idx ON aggregate_track (track_id);
      commit;
    """
    )
    connection.execute(CASCADING_SCHEMA)
