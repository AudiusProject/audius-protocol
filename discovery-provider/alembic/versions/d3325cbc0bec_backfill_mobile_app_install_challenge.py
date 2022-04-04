"""backfill mobile app install challenge

Revision ID: d3325cbc0bec
Revises: 98e2a0a25ada
Create Date: 2022-02-16 14:11:50.038998

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d3325cbc0bec"
down_revision = "98e2a0a25ada"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
        begin;
            INSERT INTO 
                user_challenges
                (challenge_id, user_id, specifier, is_complete, current_step_count, completed_blocknumber)
            SELECT
                'mobile-install',
                user_id,
                user_id,
                true,
                0,
                1
            FROM
                user_events
            WHERE
                is_mobile_user=true AND
                is_current=true
            ON CONFLICT (challenge_id, specifier)
            DO NOTHING;
        commit;
    """
    conn.execute(query)


def downgrade():
    pass
