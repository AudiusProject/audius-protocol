"""create spl token transaction

Revision ID: 58c87cf2c7e6
Revises: df4709b4391b
Create Date: 2022-03-01 21:30:05.610396

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "58c87cf2c7e6"
down_revision = "df4709b4391b"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
        CREATE TABLE IF NOT EXISTS spl_token_tx (
            last_scanned_slot INTEGER NOT NULL,
            signature VARCHAR NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            PRIMARY KEY (last_scanned_slot)
        );
        """

    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
        DROP TABLE IF EXISTS spl_token_tx;
        """
    conn.execute(query)
