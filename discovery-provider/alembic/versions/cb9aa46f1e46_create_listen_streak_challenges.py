"""create_listen_streak_challenges

Revision ID: cb9aa46f1e46
Revises: 273b8bcef694
Create Date: 2021-07-23 14:33:52.980377

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cb9aa46f1e46'
down_revision = '273b8bcef694'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "challenge_listen_streak",
        sa.Column("user_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("last_listen_date", sa.DateTime()),
        sa.Column("listen_streak", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("challenge_listen_streak")
