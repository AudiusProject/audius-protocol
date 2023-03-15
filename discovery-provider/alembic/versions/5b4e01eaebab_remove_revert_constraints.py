"""remove_revert_constraints

Revision ID: 5b4e01eaebab
Revises: b9b7a1444783
Create Date: 2023-03-15 20:30:13.789422

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5b4e01eaebab"
down_revision = "b9b7a1444783"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_blockhash_fkey;
        ALTER TABLE ursm_content_nodes DROP CONSTRAINT IF EXISTS ursm_content_nodes_blockhash_fkey;
        ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_blockhash_fkey;
        ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_blockhash_fkey;
        ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_blockhash_fkey;
        ALTER TABLE reposts DROP CONSTRAINT IF EXISTS reposts_blockhash_fkey;
        ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_blockhash_fkey;
        """
    )


def downgrade():
    pass
