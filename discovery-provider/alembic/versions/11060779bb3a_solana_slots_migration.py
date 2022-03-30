"""solana slots migration

Revision ID: 11060779bb3a
Revises: d321f0a00721
Create Date: 2022-03-29 18:49:45.022146

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "11060779bb3a"
down_revision = "d321f0a00721"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """

        begin;

            CREATE TABLE IF NOT EXISTS audius_data_txs (
                signature VARCHAR PRIMARY KEY,
                slot INTEGER NOT NULL
            );

            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

            CREATE INDEX IF NOT EXISTS users_primary ON users (is_current, user_id, txhash);

            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS slot INTEGER,
            ADD COLUMN IF NOT EXISTS user_storage_account VARCHAR,
            ADD COLUMN IF NOT EXISTS user_authority_account VARCHAR;
            
            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE users ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_pkey;

            CREATE INDEX IF NOT EXISTS tracks_primary ON tracks (is_current, track_id, txhash);

            ALTER TABLE tracks ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE tracks ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_pkey;

            CREATE INDEX IF NOT EXISTS playlists_primary ON playlists (is_current, playlist_id, txhash);

            ALTER TABLE playlists ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE playlists ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE playlists ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE reposts DROP CONSTRAINT IF EXISTS reposts_pkey;
            CREATE INDEX IF NOT EXISTS reposts_primary ON reposts (is_current, user_id, repost_item_id, repost_type, txhash);

            ALTER TABLE reposts ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE reposts ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_pkey;
            CREATE INDEX IF NOT EXISTS saves_primary ON saves (is_current, user_id, save_item_id, save_type, txhash);
            
            ALTER TABLE saves ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE saves ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT IF EXISTS ursm_content_nodes_pkey;
            CREATE INDEX IF NOT EXISTS ursm_content_nodes_primary ON ursm_content_nodes (is_current, cnode_sp_id, txhash);

            ALTER TABLE ursm_content_nodes ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_pkey;
            CREATE INDEX IF NOT EXISTS follows_primary ON follows (is_current, follower_user_id, followee_user_id, txhash);

            ALTER TABLE follows ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE follows ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE follows ALTER COLUMN blocknumber DROP NOT NULL;
            
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;

            DROP TABLE IF EXISTS audius_data_txs;

            DROP INDEX IF EXISTS users_primary;
            ALTER TABLE users ADD PRIMARY KEY (is_current, user_id, blockhash, txhash);

            ALTER TABLE users
            DROP COLUMN IF EXISTS slot,
            DROP COLUMN IF EXISTS user_storage_account,
            DROP COLUMN IF EXISTS user_authority_account;
            
            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM users where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE users ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber SET NOT NULL;

            DROP INDEX IF EXISTS tracks_primary;
            ALTER TABLE tracks ADD PRIMARY KEY (is_current, track_id, blockhash, txhash);

            ALTER TABLE tracks DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM tracks where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE tracks ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber SET NOT NULL;

            DROP INDEX IF EXISTS playlists_primary;
            ALTER TABLE playlists ADD PRIMARY KEY (is_current, playlist_id, playlist_owner_id, blockhash, txhash);

            ALTER TABLE playlists DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM playlists where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE playlists ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE playlists ALTER COLUMN blocknumber SET NOT NULL;

            DROP INDEX IF EXISTS reposts_primary;
            ALTER TABLE reposts ADD PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, blockhash, txhash);

            ALTER TABLE reposts DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM reposts where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE reposts ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber SET NOT NULL;

            DROP INDEX IF EXISTS saves_primary;
            ALTER TABLE saves ADD PRIMARY KEY (is_current, user_id, save_item_id, save_type, blockhash, txhash);
            
            ALTER TABLE saves DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM saves where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE saves ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber SET NOT NULL;


            DROP INDEX IF EXISTS ursm_content_nodes_primary;
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, blockhash, txhash);
            
            ALTER TABLE ursm_content_nodes DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM ursm_content_nodes where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber SET NOT NULL;

            DROP INDEX IF EXISTS follows_primary;
            ALTER TABLE follows ADD PRIMARY KEY (is_current, follower_user_id, followee_user_id, blockhash, txhash);
            ALTER TABLE follows DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE follows ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE follows ALTER COLUMN blocknumber SET NOT NULL;

        commit;
    """
    )
