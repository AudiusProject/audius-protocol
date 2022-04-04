"""create archived plays table

Revision ID: df4709b4391b
Revises: d180b0c624de
Create Date: 2022-01-04 23:23:40.814114

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "df4709b4391b"
down_revision = "d180b0c624de"
branch_labels = None
depends_on = None


def upgrade():
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


def downgrade():
    conn = op.get_bind()
    query = """
    DROP TABLE IF EXISTS plays_archive;
    """
    conn.execute(query)
