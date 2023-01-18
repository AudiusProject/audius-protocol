"""update  triggers

Revision ID: 6a9f01e775d5
Revises: efafdb22df81
Create Date: 2023-01-17 18:39:06.300212

"""
from pathlib import Path

import sqlalchemy
from alembic import op

# revision identifiers, used by Alembic.
revision = "6a9f01e775d5"
down_revision = "efafdb22df81"
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
    "handle_user_balance_changes.sql",
]


def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql(up_files))


def downgrade():
    pass
