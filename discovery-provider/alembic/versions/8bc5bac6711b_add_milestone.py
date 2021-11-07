"""add milestone

Revision ID: 8bc5bac6711b
Revises: e2a8aea2e2e1
Create Date: 2021-10-20 15:28:46.113178

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8bc5bac6711b'
down_revision = 'e2a8aea2e2e1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "milestones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("threshold", sa.Integer(), nullable=False),
        sa.Column("blocknumber", sa.Integer(), nullable=True),
        sa.Column("slot", sa.Integer(), nullable=True),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Index("name", "id"),
        sa.PrimaryKeyConstraint(
            "id", "name", "threshold"
        )
    )
    # Backfill Milestone for existsing listen milestones
    connection = op.get_bind()
    connection.execute(
    """
    INSERT INTO milestones (
        id,
        name,
        threshold,
        blocknumber,
        slot,
        timestamp
    )
    SELECT
        play_item_id as id,
        'LISTEN_COUNT' as name,
        CASE
            WHEN count BETWEEN 10 AND 24 THEN 10
            WHEN count BETWEEN 25 AND 49 THEN 25
            WHEN count BETWEEN 50 AND 99 THEN 50
            WHEN count BETWEEN 100 AND 499 THEN 100
            WHEN count BETWEEN 500 AND 999 THEN 500
            WHEN count BETWEEN 1000 AND 4999 THEN 1000
            WHEN count BETWEEN 5000 AND 9999 THEN 5000
            WHEN count BETWEEN 10000 AND 1999 THEN 10000
            WHEN count BETWEEN 20000 AND 4999 THEN 20000
            WHEN count BETWEEN 50000 AND 99999 THEN 50000
            WHEN count BETWEEN 100000 AND 999999 THEN 100000
            WHEN count >= 1000000 THEN 1000000
        END AS threshold,
        0 as blocknumber,
        0 as slot,
        now() as timestamp
    FROM
        aggregate_plays
    WHERE
        count >= 10;
    """
    )


def downgrade():
    op.drop_table("milestones")
