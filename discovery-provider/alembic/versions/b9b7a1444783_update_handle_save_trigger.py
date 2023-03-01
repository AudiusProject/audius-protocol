"""update handle save trigger

Revision ID: b9b7a1444783
Revises: 4b3b96d8149b
Create Date: 2023-02-28 22:55:46.626792

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = "b9b7a1444783"
down_revision = "4b3b96d8149b"
branch_labels = None
depends_on = None


up_files = ["handle_save.sql"]


def upgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)


def downgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
