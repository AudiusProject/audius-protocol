"""unlisted_tracks

Revision ID: cf614359625e
Revises: dbefdfcc9a3b
Create Date: 2019-11-08 15:40:15.672005

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "cf614359625e"
down_revision = "a11eb3450985"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("is_unlisted", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "tracks",
        sa.Column(
            "field_visibility", postgresql.JSONB(astext_type=sa.Text()), nullable=True
        ),
    )


def downgrade():
    op.drop_column("tracks", "is_unlisted")
    op.drop_column("tracks", "field_visibility")
