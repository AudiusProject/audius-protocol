"""Add artist pick track id to users table

Revision ID: a8752810936c
Revises: aab240348d73
Create Date: 2022-10-04 00:57:10.642094

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a8752810936c'
down_revision = 'aab240348d73'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("artist_pick_track_id", sa.Integer(), nullable=True))

def downgrade():
    op.drop_column("users", "artist_pick_track_id")
