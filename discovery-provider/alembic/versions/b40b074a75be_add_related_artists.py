"""Add SYSTEM_ROWS sampling function and related_artists table

Revision ID: b40b074a75be
Revises: 9ff8c8ae8de2
Create Date: 2021-08-26 07:30:14.412879

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b40b074a75be"
down_revision = "9ff8c8ae8de2"
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute(
        """
        CREATE EXTENSION tsm_system_rows;
        """
    )

    op.create_table(
        "related_artists",
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("related_artist_user_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("user_id", "related_artist_user_id"),
    )


def downgrade():
    op.get_bind().execute(
        """
        DROP EXTENSION IF EXISTS tsm_system_rows;
        """
    )
    op.drop_table("related_artists")
