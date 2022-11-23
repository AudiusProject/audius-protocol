"""create index on users created_at

Revision ID: 1eec1d124caf
Revises: 959f15b94094
Create Date: 2022-11-23 00:01:06.643480

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '1eec1d124caf'
down_revision = '959f15b94094'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS user_created_at_idx ON users (created_at, user_id) WHERE is_current;
        """
    )


def downgrade():
    conn = op.get_bind()
    conn.execute(
        """
        DROP INDEX IF EXISTS user_created_at_idx;
        """
    )
