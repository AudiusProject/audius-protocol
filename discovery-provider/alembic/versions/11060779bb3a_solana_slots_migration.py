"""solana slots migration

Revision ID: 11060779bb3a
Revises: 37a4458bb72c
Create Date: 2022-03-29 18:49:45.022146

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "11060779bb3a"
down_revision = "37a4458bb72c"
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
            UPDATE users
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE users ADD PRIMARY KEY (is_current, user_id, txhash);

            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS slot INTEGER,
            ADD COLUMN IF NOT EXISTS user_storage_account VARCHAR,
            ADD COLUMN IF NOT EXISTS user_authority_account VARCHAR;
            
            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE users ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber DROP NOT NULL;

        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;

            DROP TABLE IF EXISTS audius_data_txs;

            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
            ALTER TABLE users ADD PRIMARY KEY (is_current, user_id, blockhash, txhash);

            ALTER TABLE users
            DROP COLUMN IF EXISTS slot,
            DROP COLUMN IF EXISTS user_storage_account,
            DROP COLUMN IF EXISTS user_authority_account;
            
            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM users where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE users ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE users ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE users SET txhash = '' WHERE txhash LIKE 'unset_%%';
        commit;
    """
    )
