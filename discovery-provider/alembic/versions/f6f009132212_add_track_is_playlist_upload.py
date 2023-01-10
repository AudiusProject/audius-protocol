
"""add track is playlist upload

Revision ID: f6f009132212
Revises: ec3b20d7bce3
Create Date: 2022-12-13 16:54:11.916053

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = 'f6f009132212'
down_revision = 'ec3b20d7bce3'
branch_labels = None
depends_on = None

up_files = [
    "handle_playlist.sql",
    "handle_track.sql",
]

def column_exists(table_name, column_name):
    bind = op.get_context().bind
    insp = sa.inspect(bind)
    columns = insp.get_columns(table_name)
    return any(c["name"] == column_name for c in columns)

def upgrade():
    if not column_exists("tracks", "is_playlist_upload"):
        op.add_column(
            "tracks",
            sa.Column("is_playlist_upload", sa.Boolean(), nullable=False, server_default="false"),
        )

        connection = op.get_bind()
        connection.execute(build_sql(up_files))


def downgrade():
    if column_exists("tracks", "is_playlist_upload"):
        connection = op.get_bind()
        op.drop_column("tracks", "premium_conditions")
        sql = build_sql(up_files)
        connection = op.get_bind()
        connection.execute(sql)
