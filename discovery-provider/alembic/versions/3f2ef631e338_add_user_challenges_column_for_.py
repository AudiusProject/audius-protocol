"""add user challenges column for completed blocknumber

Revision ID: 3f2ef631e338
Revises: 80271bf86c56
Create Date: 2021-07-09 18:36:35.003673

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3f2ef631e338'
down_revision = '80271bf86c56'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("user_challenges", sa.Column(
        "completed_blocknumber", sa.Integer(), nullable=True))
    op.execute("UPDATE user_challenges SET completed_blocknumber = 1 WHERE is_complete IS true")


def downgrade():
    op.drop_column("user_challenges", "completed_blocknumber")
