"""add playlist metadata

Revision ID: f1e86fba0357
Revises: 9931f7fd118f
Create Date: 2022-07-29 20:31:41.996125

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "f1e86fba0357"
down_revision = "9931f7fd118f"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE playlists ADD COLUMN IF NOT EXISTS metadata_multihash varchar;
        """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE playlists DROP COLUMN IF EXISTS metadata_multihash;
        """
    )
