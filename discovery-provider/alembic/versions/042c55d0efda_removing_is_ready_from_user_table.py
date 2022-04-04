"""removing is_ready from User table

Revision ID: 042c55d0efda
Revises: 7b3f27e78b84
Create Date: 2020-06-01 21:29:35.777434

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "042c55d0efda"
down_revision = "e298de2becf2"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("users", "is_ready")


def downgrade():
    op.add_column("users", sa.Column("is_ready", sa.Boolean(), nullable=True))
    op.execute("UPDATE users SET is_ready = true")
    op.alter_column("users", "is_ready", nullable=False)
