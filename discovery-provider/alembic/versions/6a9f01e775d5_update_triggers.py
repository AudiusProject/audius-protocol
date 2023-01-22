"""update  triggers

Revision ID: 6a9f01e775d5
Revises: 36ed02ac38f7
Create Date: 2023-01-17 18:39:06.300212

"""

from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = "6a9f01e775d5"
down_revision = "36ed02ac38f7"
branch_labels = None
depends_on = None


up_files = [
    # New triggers
    "handle_user_balance_changes.sql",
]


def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql(up_files))


def downgrade():
    pass
