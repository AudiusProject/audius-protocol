"""Delete plays_archive table

Revision ID: 64e82a907294
Revises: 988f095a1d43
Create Date: 2023-02-13 19:13:34.023959

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "64e82a907294"
down_revision = "988f095a1d43"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("plays_archive")


def downgrade():
    conn = op.get_bind()
    query = """
        DO
        $do$
        BEGIN
            IF NOT EXISTS (
                SELECT
                FROM
                    information_schema.tables
                WHERE
                    table_name = 'plays_archive'
            ) THEN -- update indexing checkpoints based on current plays
            CREATE TABLE plays_archive (LIKE plays);

            -- add column for archive date
            ALTER TABLE
                plays_archive
            ADD
                COLUMN archived_at timestamp;

            END IF;

        END
        $do$
        """
    conn.execute(query)
