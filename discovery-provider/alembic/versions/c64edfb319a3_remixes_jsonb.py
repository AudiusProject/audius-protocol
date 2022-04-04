"""remixes-jsonb

Revision ID: c64edfb319a3
Revises: e7bf0280310b
Create Date: 2020-04-29 11:41:50.041780

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c64edfb319a3"
down_revision = "e7bf0280310b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("remix_of", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade():
    op.drop_column("tracks", "remix_of")
