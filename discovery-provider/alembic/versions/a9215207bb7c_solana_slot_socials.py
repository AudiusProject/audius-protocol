"""solana slot playlists

Revision ID: a9215207bb7c
Revises: 3a3f2c9f5320
Create Date: 2022-04-10 20:15:18.454483

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a9215207bb7c"
down_revision = "3a3f2c9f5320"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """

        begin;

            ALTER TABLE reposts DROP CONSTRAINT IF EXISTS reposts_pkey;
            UPDATE reposts
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE reposts ADD PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, txhash);

            ALTER TABLE reposts ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE reposts ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber DROP NOT NULL;

            ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_pkey;
            UPDATE saves
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE saves ADD PRIMARY KEY (is_current, user_id, save_item_id, save_type, txhash);
            
            ALTER TABLE saves ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE saves ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber DROP NOT NULL;

        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;



            ALTER TABLE reposts DROP CONSTRAINT IF EXISTS reposts_pkey;
            ALTER TABLE reposts ADD PRIMARY KEY (is_current, user_id, repost_item_id, repost_type, blockhash, txhash);

            ALTER TABLE reposts DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM reposts where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE reposts ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE reposts ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE reposts SET txhash = '' WHERE txhash LIKE 'unset_%%';

            ALTER TABLE saves DROP CONSTRAINT IF EXISTS saves_pkey;
            ALTER TABLE saves ADD PRIMARY KEY (is_current, user_id, save_item_id, save_type, blockhash, txhash);
            
            ALTER TABLE saves DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM saves where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE saves ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE saves ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE saves SET txhash = '' WHERE txhash LIKE 'unset_%%';

        commit;
    """
    )
