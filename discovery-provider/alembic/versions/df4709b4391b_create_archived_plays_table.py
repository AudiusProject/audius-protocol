"""create archived plays table

Revision ID: df4709b4391b
Revises: 85680793a611
Create Date: 2022-01-04 23:23:40.814114

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "df4709b4391b"
down_revision = "85680793a611"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
    CREATE TABLE IF NOT EXISTS plays_archive (LIKE plays INCLUDING ALL);

    -- add column for archive date
    ALTER TABLE plays_archive ADD COLUMN archived_at timestamp;
    """
    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
    DROP TABLE IF EXISTS plays_archive;
    """
    conn.execute(query)
