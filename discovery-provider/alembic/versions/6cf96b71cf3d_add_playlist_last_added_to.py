"""add-playlist-last-added-to

Revision ID: 6cf96b71cf3d
Revises: d9992d2d598c
Create Date: 2021-05-14 01:30:20.006813

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6cf96b71cf3d'
down_revision = 'd9992d2d598c'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('playlists', sa.Column('last_added_to', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('playlists', 'last_added_to')
