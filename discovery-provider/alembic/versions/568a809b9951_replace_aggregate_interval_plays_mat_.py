"""replace aggregate interval plays mat view with table

Revision ID: 568a809b9951
Revises: 7104383ac0fe
Create Date: 2021-12-27 18:51:26.264035

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "568a809b9951"
down_revision = "7104383ac0fe"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
        DO
        $do$
        BEGIN
            -- only run migration if the aggregate_interval_plays table does not already exist
            -- trying to drop the mat view aggregate_interval_plays will fail if the table aggregate_interval_plays exists
            -- also don't want to risk losing data
            IF NOT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name   = 'aggregate_interval_plays'
            ) THEN
                -- update indexing checkpoints based on current plays
                WITH latest_play_id AS (
                    SELECT MAX(id) AS id FROM plays
                )
                INSERT INTO indexing_checkpoints (tablename, last_checkpoint)
                VALUES(
                    'aggregate_interval_plays',
                    (COALESCE((SELECT id FROM latest_play_id), 0))
                )
                ON CONFLICT (tablename)
                DO UPDATE SET last_checkpoint = EXCLUDED.last_checkpoint;

                -- create aggregate_interval_plays table
                DROP TABLE IF EXISTS aggregate_interval_plays_table;
                CREATE TABLE aggregate_interval_plays_table AS (
                    SELECT
                        tracks.track_id as track_id,
                        tracks.genre as genre,
                        tracks.created_at as created_at,
                        COALESCE (week_listen_counts.count, 0) as week_listen_counts,
                        COALESCE (month_listen_counts.count, 0) as month_listen_counts
                    FROM
                        tracks
                    LEFT OUTER JOIN (
                        SELECT
                            plays.play_item_id as play_item_id,
                            count(plays.id) as count
                        FROM
                            plays
                        WHERE
                            plays.created_at > (now() - interval '1 week')
                        AND plays.id <= (
                            SELECT last_checkpoint
                            FROM indexing_checkpoints
                            WHERE tablename = 'aggregate_plays'
                        )
                        GROUP BY plays.play_item_id
                    ) as week_listen_counts ON week_listen_counts.play_item_id = tracks.track_id
                    LEFT OUTER JOIN (
                        SELECT
                            plays.play_item_id as play_item_id,
                            count(plays.id) as count
                        FROM
                            plays
                        WHERE
                            plays.created_at > (now() - interval '1 month')
                        AND plays.id <= (
                            SELECT last_checkpoint
                            FROM indexing_checkpoints
                            WHERE tablename = 'aggregate_plays'
                        )
                        GROUP BY plays.play_item_id
                    ) as month_listen_counts ON month_listen_counts.play_item_id = tracks.track_id
                    WHERE
                        tracks.is_current is True AND
                        tracks.is_delete is False AND
                        tracks.is_unlisted is False AND
                        tracks.stem_of is Null
                );

                -- drop existing aggregate_interval_plays mat view
                DROP MATERIALIZED VIEW IF EXISTS aggregate_interval_plays;

                -- rename table to replace mat view
                ALTER TABLE aggregate_interval_plays_table RENAME TO aggregate_interval_plays;

                -- create primary key
                ALTER TABLE aggregate_interval_plays ADD PRIMARY KEY (track_id);

                -- create indexes
                CREATE INDEX IF NOT EXISTS interval_play_week_count_idx ON aggregate_interval_plays (week_listen_counts);
                CREATE INDEX IF NOT EXISTS interval_play_month_count_idx ON aggregate_interval_plays (month_listen_counts);

            END IF;
        END
        $do$
        """

    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
        begin;

        -- drop aggregate_interval_plays table
        DROP TABLE IF EXISTS aggregate_interval_plays;

        --- ======================= AGGREGATE INTERVAL PLAYS ======================= from version 92571f94989a
        DROP MATERIALIZED VIEW IF EXISTS aggregate_interval_plays;

        CREATE MATERIALIZED VIEW aggregate_interval_plays as
        SELECT
            tracks.track_id as track_id,
            tracks.genre as genre,
            tracks.created_at as created_at,
            COALESCE (week_listen_counts.count, 0) as week_listen_counts,
            COALESCE (month_listen_counts.count, 0) as month_listen_counts
        FROM
            tracks
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.created_at > (now() - interval '1 week')
            GROUP BY plays.play_item_id
        ) as week_listen_counts ON week_listen_counts.play_item_id = tracks.track_id
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.created_at > (now() - interval '1 month')
            GROUP BY plays.play_item_id
        ) as month_listen_counts ON month_listen_counts.play_item_id = tracks.track_id
        LEFT OUTER JOIN (
            SELECT
                plays.play_item_id as play_item_id,
                count(plays.id) as count
            FROM
                plays
            WHERE
                plays.created_at > (now() - interval '1 year')
            GROUP BY plays.play_item_id
        ) as year_listen_counts ON year_listen_counts.play_item_id = tracks.track_id
        WHERE
            tracks.is_current is True AND
            tracks.is_delete is False AND
            tracks.is_unlisted is False AND
            tracks.stem_of is Null;

        -- add index on above materialized view
        CREATE INDEX IF NOT EXISTS interval_play_track_id_idx ON aggregate_interval_plays (track_id);
        CREATE INDEX IF NOT EXISTS interval_play_week_count_idx ON aggregate_interval_plays (week_listen_counts);
        CREATE INDEX IF NOT EXISTS interval_play_month_count_idx ON aggregate_interval_plays (month_listen_counts);
        CREATE INDEX IF NOT EXISTS interval_play_year_count_idx ON aggregate_interval_plays (year_listen_counts);

        commit;
        """

    conn.execute(query)
