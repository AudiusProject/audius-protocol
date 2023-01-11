"""backfill null artist pick discrepancies in discprov

Revision ID: 36ed02ac38f7
Revises: efafdb22df81
Create Date: 2023-01-06 23:42:58.493746

"""
import os

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '36ed02ac38f7'
down_revision = 'efafdb22df81'
branch_labels = None
depends_on = None


def upgrade():
    env = os.getenv("audius_discprov_env")
    if env == "prod":
        connection = op.get_bind()
        sql = """UPDATE users
        SET artist_pick_track_id = null
        WHERE users.is_current = True AND users.updated_at < '2023-01-06 08:35:00' AND users.handle_lc = ANY(ARRAY['yyosu', 'amc_music', 'merawan', 'joshbay', 'ohrage']);
        """
        connection.execute(sql)


def downgrade():
    pass
