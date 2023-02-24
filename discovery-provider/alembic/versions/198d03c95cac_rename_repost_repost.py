"""rename repost repost

Revision ID: 198d03c95cac
Revises: abdb338530cd
Create Date: 2023-02-24 21:51:29.932807

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '198d03c95cac'
down_revision = 'abdb338530cd'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("reposts", "is_repost_repost")
    op.add_column(
        "reposts",
        sa.Column(
            "is_repost_of_repost", sa.Boolean(), nullable=False, server_default="false"
        ),
    )


def downgrade():
    op.drop_column("reposts", "is_repost_of_repost")

