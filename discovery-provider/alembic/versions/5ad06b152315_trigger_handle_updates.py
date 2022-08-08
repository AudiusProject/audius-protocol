"""trigger handle updates

Revision ID: 5ad06b152315
Revises: 9931f7fd118f
Create Date: 2022-08-08 14:41:24.920944

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = "5ad06b152315"
down_revision = "9931f7fd118f"
branch_labels = None
depends_on = None


up_files = [
    "drop_triggers.sql",
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
    print("fuuu")
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
