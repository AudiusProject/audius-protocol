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


#   audius_data_txs table (new):
# 	slot           (integer)
# 	signature      (varchar)


# -----------------------------------

# Users (modification):
# 	slot                   (integer)
#   user_storage_account   (varchar)
# 	user_authority_account (varchar)


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """

        begin;
            CREATE EXTENSION IF NOT EXISTS pgcrypto;

            CREATE OR REPLACE FUNCTION generate_uid(size INT) RETURNS TEXT AS $$
            DECLARE
            characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            bytes BYTEA := gen_random_bytes(size);
            l INT := length(characters);
            i INT := 0;
            output TEXT := '';
            BEGIN
            WHILE i < size LOOP
                output := output || substr(characters, get_byte(bytes, i) %% l + 1, 1);
                i := i + 1;
            END LOOP;
            RETURN output;
            END;
            $$ LANGUAGE plpgsql VOLATILE;

            CREATE TABLE IF NOT EXISTS audius_data_txs (
                signature VARCHAR PRIMARY KEY,
                slot INTEGER NOT NULL
            );


            UPDATE users
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';

            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users ADD PRIMARY KEY (is_current, user_id, txhash);

            ALTER TABLE users
            ADD COLUMN slot INTEGER,
            ADD COLUMN user_storage_account VARCHAR,
            ADD COLUMN user_authority_account VARCHAR;
            
            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE users ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE tracks DROP CONSTRAINT tracks_pkey;
            UPDATE tracks
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';

            ALTER TABLE tracks ADD PRIMARY KEY (is_current, track_id, txhash);

            ALTER TABLE tracks
            ADD COLUMN slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE tracks ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE playlists DROP CONSTRAINT playlists_pkey;
            UPDATE playlists
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';

            ALTER TABLE playlists ADD PRIMARY KEY (is_current, playlist_id, txhash);

            ALTER TABLE playlists
            ADD COLUMN slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE playlists ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE playlists ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE reposts DROP CONSTRAINT reposts_pkey;
            UPDATE reposts
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';
            ALTER TABLE reposts ADD PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, txhash);

            ALTER TABLE reposts
            ADD COLUMN slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE reposts ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE saves DROP CONSTRAINT saves_pkey;
            UPDATE saves
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';
            ALTER TABLE saves ADD PRIMARY KEY (is_current, user_id, save_item_id, save_type, txhash);
            
            ALTER TABLE saves
            ADD COLUMN slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE saves ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            UPDATE ursm_content_nodes
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, txhash);

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, txhash);

            ALTER TABLE ursm_content_nodes
            ADD COLUMN slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE follows DROP CONSTRAINT follows_pkey;
            UPDATE follows
                SET txhash = ('unset_' || generate_uid(10))
                WHERE txhash='';
            ALTER TABLE follows ADD PRIMARY KEY (is_current, follower_user_id, followee_user_id, txhash);

            ALTER TABLE follows
            ADD COLUMN slot INTEGER;

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

            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users ADD PRIMARY KEY (is_current, user_id, blockhash, txhash);

            ALTER TABLE users
            DROP COLUMN slot,
            DROP COLUMN user_storage_account,
            DROP COLUMN user_authority_account;
            
            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM users where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE users ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber SET NOT NULL;

            ALTER TABLE tracks DROP CONSTRAINT tracks_pkey;
            ALTER TABLE tracks ADD PRIMARY KEY (is_current, track_id, blockhash, txhash);

            ALTER TABLE tracks
            DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM tracks where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE tracks ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber SET NOT NULL;

            ALTER TABLE playlists DROP CONSTRAINT playlists_pkey;
            ALTER TABLE playlists ADD PRIMARY KEY (is_current, playlist_id, playlist_owner_id, blockhash, txhash);

            ALTER TABLE playlists
            DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM playlists where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE playlists ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE playlists ALTER COLUMN blocknumber SET NOT NULL;

            ALTER TABLE reposts DROP CONSTRAINT reposts_pkey;
            ALTER TABLE reposts ADD PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, blockhash, txhash);

            ALTER TABLE reposts
            DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM reposts where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE reposts ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber SET NOT NULL;

            ALTER TABLE saves DROP CONSTRAINT saves_pkey;
            ALTER TABLE saves ADD PRIMARY KEY (is_current, user_id, save_item_id, save_type, blockhash, txhash);
            
            ALTER TABLE saves
            DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM saves where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE saves ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber SET NOT NULL;


            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, blockhash, txhash);
            
            ALTER TABLE ursm_content_nodes
            DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM ursm_content_nodes where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber SET NOT NULL;

            ALTER TABLE follows DROP CONSTRAINT follows_pkey;
            ALTER TABLE follows ADD PRIMARY KEY (is_current, follower_user_id, followee_user_id, blockhash, txhash);
            ALTER TABLE follows DROP COLUMN slot;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE follows ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE follows ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE users
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE tracks
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE playlists
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE reposts
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE saves
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE saves
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

            UPDATE follows
                SET txhash = ''
                WHERE txhash LIKE 'unset_%%';

        commit;
    """
    )
