"""create aggregate monthly plays

Revision ID: 3ea8467836d8
Revises: 8e4dda8255fd
Create Date: 2022-01-26 18:22:41.783986

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3ea8467836d8"
down_revision = "8e4dda8255fd"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
        CREATE TABLE IF NOT EXISTS aggregate_monthly_plays (
            play_item_id INTEGER NOT NULL,
            timestamp DATE NOT NULL,
            count INTEGER NOT NULL,
            PRIMARY KEY (play_item_id, timestamp)
        );
        """

    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
        DROP TABLE IF EXISTS aggregate_monthly_plays;
        """
    conn.execute(query)
