"""Add stem metadata to track table

Revision ID: e7bf0280310b
Revises: 5add54e23282
Create Date: 2020-05-04 13:51:22.861504

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "e7bf0280310b"
down_revision = "5add54e23282"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("stem_of", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade():
    op.drop_column("tracks", sa.Column("stem_of"))
