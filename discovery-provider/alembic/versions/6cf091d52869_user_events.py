"""user_events

Revision ID: 6cf091d52869
Revises: 3f2ef631e338
Create Date: 2021-07-09 07:18:52.254180

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6cf091d52869"
down_revision = "3f2ef631e338"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_events",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("blockhash", sa.String(), nullable=False),
        sa.Column("blocknumber", sa.Integer(), nullable=False),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("referrer", sa.Integer(), nullable=True),
        sa.Column("is_mobile_user", sa.Boolean(), nullable=False, default=False),
        sa.Index("user_id", "is_current"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("user_events")
