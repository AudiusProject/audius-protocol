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
        ALTER TABLE users DROP CONSTRAINT users_blockhash_fkey;
        ALTER TABLE users DROP CONSTRAINT users_blocknumber_fkey;
        ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_blockhash_fkey;
        ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_blocknumber_fkey;
        ALTER TABLE tracks DROP CONSTRAINT tracks_blockhash_fkey;
        ALTER TABLE tracks DROP CONSTRAINT tracks_blocknumber_fkey;
        ALTER TABLE saves DROP CONSTRAINT saves_blockhash_fkey;
        ALTER TABLE saves DROP CONSTRAINT saves_blocknumber_fkey;
        ALTER TABLE follows DROP CONSTRAINT follows_blockhash_fkey;
        ALTER TABLE follows DROP CONSTRAINT follows_blocknumber_fkey;
        ALTER TABLE reposts DROP CONSTRAINT reposts_blockhash_fkey;
        ALTER TABLE reposts DROP CONSTRAINT reposts_blocknumber_fkey;
        ALTER TABLE playlists DROP CONSTRAINT playlists_blockhash_fkey;
        ALTER TABLE playlists DROP CONSTRAINT playlists_blocknumber_fkey;
        """
    )


def downgrade():
    pass
