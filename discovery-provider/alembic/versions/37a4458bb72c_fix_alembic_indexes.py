"""fix_alembic_indexes

Revision ID: 37a4458bb72c
Revises: d321f0a00721
Create Date: 2022-03-31 19:34:35.793844

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "37a4458bb72c"
down_revision = "d321f0a00721"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        """
    BEGIN;

    DROP INDEX IF EXISTS track_id;
    DROP INDEX IF EXISTS user_id;
    DROP INDEX IF EXISTS name;

    CREATE INDEX IF NOT EXISTS track_routes_track_id_idx ON track_routes (track_id, is_current);
    CREATE INDEX IF NOT EXISTS user_events_user_id_idx ON user_events (user_id, is_current);
    CREATE INDEX IF NOT EXISTS milestones_name_idx ON milestones (name, id);

    COMMIT;
    """
    )


def downgrade():
    conn = op.get_bind()
    conn.execute(
        """
    BEGIN;

    DROP INDEX IF EXISTS track_routes_track_id_idx;
    DROP INDEX IF EXISTS user_events_user_id_idx;
    DROP INDEX IF EXISTS milestones_name_idx;

    CREATE INDEX IF NOT EXISTS track_id ON track_routes (is_current);
    CREATE INDEX IF NOT EXISTS user_id ON user_events (is_current);
    CREATE INDEX IF NOT EXISTS name ON milestones (id);

    COMMIT;
    """
    )
