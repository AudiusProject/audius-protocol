"""fix_primary_key_constraints

Revision ID: bff7853e0983
Revises: 8a07fa2fe97b
Create Date: 2021-04-03 11:51:24.385460

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "bff7853e0983"
down_revision = "8a07fa2fe97b"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()

    connection.execute(
        """
        begin;
            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (is_current, user_id, blockhash, txhash);

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE ursm_content_nodes ADD CONSTRAINT ursm_content_nodes_pkey PRIMARY KEY (is_current, cnode_sp_id, blockhash, txhash);

            ALTER TABLE tracks DROP CONSTRAINT tracks_pkey;
            ALTER TABLE tracks ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE tracks ADD CONSTRAINT tracks_pkey PRIMARY KEY (is_current, track_id, blockhash, txhash);

            ALTER TABLE playlists DROP CONSTRAINT playlists_pkey;
            ALTER TABLE playlists ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE playlists ADD CONSTRAINT playlists_pkey PRIMARY KEY (is_current, playlist_id, playlist_owner_id, blockhash, txhash);

            ALTER TABLE reposts DROP CONSTRAINT reposts_pkey;
            ALTER TABLE reposts ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE reposts ADD CONSTRAINT reposts_pkey PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, blockhash, txhash);

            ALTER TABLE saves DROP CONSTRAINT saves_pkey;
            ALTER TABLE saves ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE saves ADD CONSTRAINT saves_pkey PRIMARY KEY (is_current, user_id, save_item_id, save_type, blockhash, txhash);

            ALTER TABLE follows DROP CONSTRAINT follows_pkey;
            ALTER TABLE follows ADD COLUMN IF NOT EXISTS txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE follows ADD CONSTRAINT follows_pkey PRIMARY KEY (is_current, follower_user_id, followee_user_id, blockhash, txhash);
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()

    connection.execute(
        """
        begin;
            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users DROP COLUMN txhash;
            ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (is_current, user_id, blockhash);

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes DROP COLUMN txhash;
            ALTER TABLE ursm_content_nodes ADD CONSTRAINT ursm_content_nodes_pkey PRIMARY KEY (is_current, cnode_sp_id, blockhash);

            ALTER TABLE tracks DROP CONSTRAINT tracks_pkey;
            ALTER TABLE tracks DROP COLUMN txhash;
            ALTER TABLE tracks ADD CONSTRAINT tracks_pkey PRIMARY KEY (is_current, track_id, blockhash);

            ALTER TABLE playlists DROP CONSTRAINT playlists_pkey;
            ALTER TABLE playlists DROP COLUMN txhash;
            ALTER TABLE playlists ADD CONSTRAINT playlists_pkey PRIMARY KEY (is_current, playlist_id, playlist_owner_id, blockhash);

            ALTER TABLE reposts DROP CONSTRAINT reposts_pkey;
            ALTER TABLE reposts DROP COLUMN txhash;
            ALTER TABLE reposts ADD CONSTRAINT reposts_pkey PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, blockhash);

            ALTER TABLE saves DROP CONSTRAINT saves_pkey;
            ALTER TABLE saves DROP COLUMN txhash;
            ALTER TABLE saves ADD CONSTRAINT saves_pkey PRIMARY KEY (is_current, user_id, save_item_id, save_type, blockhash);

            ALTER TABLE follows DROP CONSTRAINT follows_pkey;
            ALTER TABLE follows DROP COLUMN txhash;
            ALTER TABLE follows ADD CONSTRAINT follows_pkey PRIMARY KEY (is_current, follower_user_id, followee_user_id, blockhash);
        commit;
    """
    )
