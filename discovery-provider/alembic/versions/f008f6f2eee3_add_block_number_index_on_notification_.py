"""add block number index on notification_seen

Revision ID: f008f6f2eee3
Revises: d43a7fd867f3
Create Date: 2023-03-20 20:44:29.924432

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "f008f6f2eee3"
down_revision = "d43a7fd867f3"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        """
        CREATE INDEX IF NOT EXISTS notification_seen_blocknumber_idx ON notification_seen (blocknumber);
        """
    )


def downgrade():
    conn = op.get_bind()
    conn.execute(
        """
        DROP INDEX IF EXISTS notification_seen_blocknumber_idx;
        """
    )
