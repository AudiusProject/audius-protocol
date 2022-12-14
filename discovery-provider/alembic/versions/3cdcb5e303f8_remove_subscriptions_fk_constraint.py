"""remove subscriptions fk constraint

Revision ID: 3cdcb5e303f8
Revises: 7b843f2d3a0d
Create Date: 2022-12-14 01:21:56.405583

"""
import os

from alembic import op

# revision identifiers, used by Alembic.
revision = '3cdcb5e303f8'
down_revision = '7b843f2d3a0d'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE subscriptions
        DROP CONSTRAINT IF EXISTS subscriptions_blockhash_fkey;

        ALTER TABLE subscriptions
        DROP CONSTRAINT IF EXISTS subscriptions_blocknumber_fkey;

        DELETE FROM subscriptions WHERE blockhash = '0x9145411a386832d5847144a560cdfcda6c041f169a40a386e8d6514743ad38a4';
        """
    )

def downgrade():
    pass
