"""solana slot follows

Revision ID: 2cfd17a60647
Revises: a9215207bb7c
Create Date: 2022-04-10 20:18:38.443308

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2cfd17a60647"
down_revision = "a9215207bb7c"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """

        begin;

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT IF EXISTS ursm_content_nodes_pkey;
            UPDATE ursm_content_nodes
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, txhash);

            ALTER TABLE ursm_content_nodes ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_pkey;
            UPDATE follows
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE follows ADD PRIMARY KEY (is_current, follower_user_id, followee_user_id, txhash);

            ALTER TABLE follows ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE follows ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE follows ALTER COLUMN blocknumber DROP NOT NULL;
            

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE user_events ADD COLUMN IF NOT EXISTS slot INTEGER;
            ALTER TABLE user_events ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE user_events ALTER COLUMN blocknumber DROP NOT NULL;

        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT IF EXISTS ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes ADD PRIMARY KEY (is_current, cnode_sp_id, blockhash, txhash);
            
            ALTER TABLE ursm_content_nodes DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM ursm_content_nodes where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE ursm_content_nodes ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE ursm_content_nodes SET txhash = '' WHERE txhash LIKE 'unset_%%';

            ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_pkey;
            ALTER TABLE follows ADD PRIMARY KEY (is_current, follower_user_id, followee_user_id, blockhash, txhash);
            ALTER TABLE follows DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE follows ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE follows ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE follows SET txhash = '' WHERE txhash LIKE 'unset_%%';

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE user_events DROP COLUMN IF EXISTS slot;
            ALTER TABLE user_events ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE user_events ALTER COLUMN blocknumber SET NOT NULL;

        commit;
    """
    )
