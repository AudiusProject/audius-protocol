"""migrate triggers for notifiations

Revision ID: 58b26285cdcf
Revises: b0623220e904
Create Date: 2022-07-13 16:02:12.264201

"""
from pathlib import Path

import sqlalchemy
from alembic import op

# revision identifiers, used by Alembic.
revision = "58b26285cdcf"
down_revision = "b0623220e904"
branch_labels = None
depends_on = None


def load_sql(name):
    path = Path(__file__).parent.joinpath(f"../trigger_sql/{name}")
    with open(path) as f:
        return f.read()


def build_sql(file_names):
    files = [load_sql(f) for f in file_names]
    inner_sql = "\n;\n".join(files)
    return sqlalchemy.text("begin; \n\n " + inner_sql + " \n\n commit;")


up_files = [
    # New triggers
    "handle_challenge_disbursements.sql",
    "handle_supporter_rank_ups.sql",
    "handle_reaction.sql",
    "handle_user_tip.sql",
    # Updates to old triggers
    "handle_repost.sql",
    "handle_save.sql",
    "handle_track.sql",
    "handle_follow.sql",
]


def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql(up_files))


def downgrade():
    pass
