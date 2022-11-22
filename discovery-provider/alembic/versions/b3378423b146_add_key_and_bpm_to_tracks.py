"""add key and bpm to tracks

Revision ID: b3378423b146
Revises: 959f15b94094
Create Date: 2022-11-22 23:41:04.372901

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3378423b146'
down_revision = '959f15b94094'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tracks", sa.Column("key", sa.String(), nullable=True))
    op.add_column("tracks", sa.Column("bpm", sa.Integer(), nullable=True))

def downgrade():
    op.drop_column("tracks", "key")
    op.drop_column("tracks", "bpm")
