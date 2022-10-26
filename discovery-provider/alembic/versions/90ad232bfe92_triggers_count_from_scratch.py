"""triggers count from scratch

Revision ID: 90ad232bfe92
Revises: ab56e2d974a6
Create Date: 2022-08-02 17:21:16.257167

"""
from pathlib import Path

import sqlalchemy
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "90ad232bfe92"
down_revision = "ab56e2d974a6"
branch_labels = None
depends_on = None


def load_sql(name):
    path = Path(__file__).parent.joinpath(f"../trigger_sql/{name}")
    with open(path) as f:
        return f.read()


up_files = [
    "migrate_agg_playlist.sql",
    "migrate_agg_track.sql",
    "migrate_agg_user.sql",
    "handle_follow.sql",
    "handle_playlist.sql",
    "handle_repost.sql",
    "handle_save.sql",
    "handle_track.sql",
    "handle_user.sql",
]


def build_sql(file_names):
    files = [load_sql(f) for f in file_names]
    inner_sql = "\n;\n".join(files)
    return sqlalchemy.text("begin; \n\n " + inner_sql + " \n\n commit;")


def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql(up_files))


def downgrade():
    pass
