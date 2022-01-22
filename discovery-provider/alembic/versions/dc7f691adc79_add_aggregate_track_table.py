"""add aggregate track table

Revision ID: dc7f691adc79
Revises: a6d2e50a8efa
Create Date: 2022-01-20 18:21:40.504845

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "dc7f691adc79"
down_revision = "a6d2e50a8efa"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
      begin;
        DROP INDEX IF EXISTS aggregate_track_idx;
        DROP MATERIALIZED VIEW aggregate_track CASCADE;
      commit;
    """
    )
    connection.execute(
        """
      begin;
        CREATE TABLE aggregate_track (
            track_id     integer NOT NULL UNIQUE PRIMARY KEY,
            repost_count integer NOT NULL,
            save_count   integer NOT NULL
        );
        CREATE INDEX aggregate_track_idx ON aggregate_track (track_id);
      commit;
    """
    )


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
