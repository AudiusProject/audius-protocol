"""solana slot tracks

Revision ID: 2dbbc9c484e3
Revises: 11060779bb3a
Create Date: 2022-04-10 20:12:18.383547

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2dbbc9c484e3"
down_revision = "11060779bb3a"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;

            ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_pkey;
            UPDATE tracks
                SET txhash = ('unset_' || substr(md5(random()::text), 0, 10) || substr(blockhash, 3, 13))
                WHERE txhash='';
            ALTER TABLE tracks ADD PRIMARY KEY (is_current, track_id, txhash);

            ALTER TABLE tracks ADD COLUMN IF NOT EXISTS slot INTEGER;

            -- Drop NOT NULL Constraint on POA blockhash and tx hash columns
            ALTER TABLE tracks ALTER COLUMN blockhash DROP NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber DROP NOT NULL;
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;

            ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_pkey;
            ALTER TABLE tracks ADD PRIMARY KEY (is_current, track_id, blockhash, txhash);

            ALTER TABLE tracks DROP COLUMN IF EXISTS slot;

            -- Add NOT NULL Constraint on POA blockhash and tx hash columns
            DELETE FROM tracks where blockhash IS NULL or blocknumber IS NULL;
            ALTER TABLE tracks ALTER COLUMN blockhash SET NOT NULL;
            ALTER TABLE tracks ALTER COLUMN blocknumber SET NOT NULL;

            UPDATE tracks SET txhash = '' WHERE txhash LIKE 'unset_%%';

        commit;
    """
    )
