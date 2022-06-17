"""agg_triggers

Revision ID: d615bdcc0e56
Revises: cdf1f6197fc6
Create Date: 2022-06-16 19:47:07.917580

"""
from pathlib import Path

import sqlalchemy
from alembic import op

# revision identifiers, used by Alembic.
revision = "d615bdcc0e56"
down_revision = "cdf1f6197fc6"
branch_labels = None
depends_on = None


def load_sql(name):
    path = Path(__file__).parent.joinpath(f"../wip_sql/{name}")
    with open(path) as f:
        return f.read()


file_names = [
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


def build_sql():
    files = [load_sql(f) for f in file_names]
    inner_sql = "\n;\n".join(files)
    return sqlalchemy.text("begin; \n\n " + inner_sql + " \n\n commit;")


def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql())


def downgrade():
    pass
