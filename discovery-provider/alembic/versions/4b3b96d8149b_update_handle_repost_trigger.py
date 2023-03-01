"""update handle repost trigger

Revision ID: 4b3b96d8149b
Revises: 198d03c95cac
Create Date: 2023-02-28 22:55:38.194570

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = "4b3b96d8149b"
down_revision = "198d03c95cac"
branch_labels = None
depends_on = None


up_files = ["handle_repost.sql"]


def upgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)


def downgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
