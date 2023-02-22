"""Add is_save_of_repost to saves table

Revision ID: abdb338530cd
Revises: 9b4e12c0c428
Create Date: 2023-02-22 22:24:41.103754

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "abdb338530cd"
down_revision = "9b4e12c0c428"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "saves",
        sa.Column(
            "is_save_of_repost",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
    )


def downgrade():
    op.drop_column("reposts", "is_save_of_repost")
