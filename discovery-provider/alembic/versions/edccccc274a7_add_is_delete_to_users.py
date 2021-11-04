"""Add is_delete to users

Revision ID: edccccc274a7
Revises: e2a8aea2e2e1
Create Date: 2021-11-04 18:31:25.972519

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "edccccc274a7"
down_revision = "e2a8aea2e2e1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_delete", sa.Boolean(), nullable=False))


def downgrade():
    op.drop_column("users", "is_delete")
