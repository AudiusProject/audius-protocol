"""create_subscriptions_table

Revision ID: 03dbd1b775c5
Revises: 42d5afb85d42
Create Date: 2022-11-02 03:16:19.526141

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '03dbd1b775c5'
down_revision = '42d5afb85d42'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "subscriptions",
        sa.Column("blockhash", sa.String()),
        sa.Column("blocknumber", sa.Integer(), index=True),
        sa.Column("subscriber_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("is_current", sa.Boolean(), nullable=False),
        sa.Column("is_delete", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.current_timestamp()),
        sa.Column("txhash", sa.String(), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(
            ["blockhash"],
            ["blocks.blockhash"],
        ),
        sa.ForeignKeyConstraint(
            ["blocknumber"],
            ["blocks.number"],
        ),
        sa.PrimaryKeyConstraint(
            "subscriber_id", "user_id", "is_current", "txhash"
        ),
    )


def downgrade():
    op.drop_table("subscriptions")
