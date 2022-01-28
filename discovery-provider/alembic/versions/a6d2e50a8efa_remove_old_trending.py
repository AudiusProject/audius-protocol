"""remove_old_trending

Revision ID: a6d2e50a8efa
Revises: 7104383ac0fe
Create Date: 2022-01-21 04:00:29.311676

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a6d2e50a8efa"
down_revision = "7104383ac0fe"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
        begin;
            DROP MATERIALIZED VIEW IF EXISTS trending_params_aSPET;
        commit;
    """
    conn.execute(query)


def downgrade():
    # No down migration as this is destructive
    pass
