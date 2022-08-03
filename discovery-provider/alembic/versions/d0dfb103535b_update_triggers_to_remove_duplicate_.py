"""update triggers to remove duplicate inserts

Revision ID: d0dfb103535b
Revises: 35584b65c55e
Create Date: 2022-08-03 18:18:04.549325

"""
from pathlib import Path

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "d0dfb103535b"
down_revision = "35584b65c55e"
branch_labels = None
depends_on = None


def load_sql(name):
    path = Path(__file__).parent.joinpath(f"../trigger_sql/{name}")
    with open(path) as f:
        return f.read()


def build_sql(file_names):
    files = [load_sql(f) for f in file_names]
    inner_sql = "\n;\n".join(files)
    return sa.text("begin; \n\n " + inner_sql + " \n\n commit;")


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
