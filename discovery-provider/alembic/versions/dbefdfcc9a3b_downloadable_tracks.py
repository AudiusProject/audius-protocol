"""downloadable_tracks

Revision ID: dbefdfcc9a3b
Revises: e9a9c6c2e3b7
Create Date: 2019-10-29 13:38:42.080436

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "dbefdfcc9a3b"
down_revision = "e9a9c6c2e3b7"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("download", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade():
    op.drop_column("tracks", "download")
