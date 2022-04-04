"""create hourly play metrics table

Revision ID: a41727360622
Revises: 75b670a37598
Create Date: 2021-12-10 00:05:16.668077

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a41727360622'
down_revision = '75b670a37598'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "hourly_play_counts",
        sa.Column("hourly_timestamp", sa.DateTime(), primary_key=True, nullable=False),
        sa.Column("play_count", sa.Integer(), nullable=False),
    )

def downgrade():
    op.drop_table("hourly_play_counts")
