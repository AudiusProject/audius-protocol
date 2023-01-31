"""handle_repost_fix

Revision ID: 72b030bb3dcb
Revises: 6a9f01e775d5
Create Date: 2023-01-31 17:56:07.385681

"""
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = '72b030bb3dcb'
down_revision = '6a9f01e775d5'
branch_labels = None
depends_on = None

up_files = [
    "handle_repost.sql"
]

def upgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)


def downgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
