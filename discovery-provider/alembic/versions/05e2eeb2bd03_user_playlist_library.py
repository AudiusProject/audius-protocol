"""user_playlist_library

Revision ID: 05e2eeb2bd03
Revises: c8d2be7dcccc
Create Date: 2021-05-18 19:12:33.451567

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '05e2eeb2bd03'
down_revision = 'c8d2be7dcccc'
branch_labels = None
depends_on = None


def upgrade():
    # Add the user playlist library column as JSONB, which stores the folder structure
    # for a user's favorite playlists
    op.add_column('users', sa.Column('playlist_library', postgresql.JSONB(), nullable=True))


def downgrade():
    op.drop_column('users', 'playlist_library')
