"""Add updated_at to UserTip

Revision ID: a83814aeb4a1
Revises: 0d2067242dd5
Create Date: 2022-05-14 03:11:26.246894

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a83814aeb4a1"
down_revision = "0d2067242dd5"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user_tips",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
    )


def downgrade():
    op.drop_column("user_tips", "updated_at")
