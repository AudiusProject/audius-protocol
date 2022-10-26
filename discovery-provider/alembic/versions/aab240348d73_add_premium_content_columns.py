"""add-premium-content-columns

Revision ID: aab240348d73
Revises: 5d3f95470222
Create Date: 2022-08-22 20:22:22.439424

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "aab240348d73"
down_revision = "551f5fc03862"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("is_premium", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "tracks",
        sa.Column("premium_conditions", postgresql.JSONB(), nullable=True),
    )

    connection = op.get_bind()
    connection.execute(
        """
        begin;
            CREATE INDEX IF NOT EXISTS track_is_premium_idx ON tracks (is_premium, is_current, is_delete);
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            DROP INDEX IF EXISTS track_is_premium_idx;
        commit;
    """
    )

    op.drop_column("tracks", "premium_conditions")
    op.drop_column("tracks", "is_premium")
