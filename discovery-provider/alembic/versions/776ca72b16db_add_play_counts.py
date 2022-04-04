"""Add play counts

Revision ID: 776ca72b16db
Revises: 626aa04489af
Create Date: 2020-07-20 18:35:47.571403

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "776ca72b16db"
down_revision = "626aa04489af"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "plays",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("play_item_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    connection = op.get_bind()

    # aggreagate plays mat view
    connection.execute(
        """
      CREATE MATERIALIZED VIEW aggregate_plays as
      SELECT
        plays.play_item_id as play_item_id,
        count(*) as count
      FROM
          plays
      GROUP BY plays.play_item_id;

      -- add index on above materialized view
      CREATE INDEX play_item_id_idx ON aggregate_plays (play_item_id);
    """
    )


def downgrade():
    connection = op.get_bind()
    # aggreagate plays mat view
    connection.execute(
        """
      -- Drop
      DROP INDEX IF EXISTS play_item_id_idx;
      DROP MATERIALIZED VIEW IF EXISTS aggregate_plays;
    """
    )

    op.drop_table("plays")
