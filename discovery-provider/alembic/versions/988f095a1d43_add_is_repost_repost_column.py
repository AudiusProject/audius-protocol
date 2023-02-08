"""add_is_repost_repost_column

Revision ID: 988f095a1d43
Revises: 6f98e9709e3e
Create Date: 2023-02-02 21:20:03.243055

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "988f095a1d43"
down_revision = "6f98e9709e3e"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "reposts",
        sa.Column(
            "is_repost_repost", sa.Boolean(), nullable=False, server_default="false"
        ),
    )


def downgrade():
    op.drop_column("reposts", "is_repost_repost")
