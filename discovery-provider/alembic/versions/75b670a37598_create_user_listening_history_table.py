"""create user listening history table

Revision ID: 75b670a37598
Revises: 6b5186e7d28f
Create Date: 2021-12-07 00:37:35.632329

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '75b670a37598'
down_revision = '6b5186e7d28f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_listening_history",
        sa.Column("user_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column(
            "listening_history", postgresql.JSONB, nullable=False
        ),
        # listening_history JSON schema
        # [
        #   {"track_id": 1, "timestamp": "2011-01-01 00:00:00"},
        #   {"track_id": 2, "timestamp": "2012-02-02 00:00:00"}
        # ]
    )


def downgrade():
    op.drop_table("user_listening_history")
