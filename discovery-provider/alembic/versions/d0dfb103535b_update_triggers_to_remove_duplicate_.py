"""update triggers to remove duplicate inserts

Revision ID: d0dfb103535b
Revises: 35584b65c55e
Create Date: 2022-08-03 18:18:04.549325

"""

import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = "d0dfb103535b"
down_revision = "35584b65c55e"
branch_labels = None
depends_on = None


up_files = [
    "handle_follow.sql",
    "handle_playlist.sql",
    "handle_repost.sql",
    "handle_save.sql",
    "handle_track.sql",
    "handle_user.sql",
]


def upgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)


def downgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
