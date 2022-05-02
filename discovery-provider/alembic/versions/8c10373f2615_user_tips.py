"""User Tips

Revision ID: 8c10373f2615
Revises: 2cfd17a60647
Create Date: 2022-04-14 00:06:55.572866

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import table_exists

# revision identifiers, used by Alembic.
revision = "8c10373f2615"
down_revision = "2cfd17a60647"
branch_labels = None
depends_on = None


def upgrade():
    # USER TIPS
    if not table_exists("user_tips"):
        op.create_table(
            "user_tips",
            sa.Column("slot", sa.Integer(), nullable=False),
            sa.Column("signature", sa.String(), nullable=False),
            sa.Column("sender_user_id", sa.Integer(), nullable=False),
            sa.Column("receiver_user_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.BigInteger(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint("slot", "signature"),
        )
        op.create_index(
            op.f("ix_user_tips_receiver_user_id"),
            "user_tips",
            ["receiver_user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_user_tips_sender_user_id"),
            "user_tips",
            ["sender_user_id"],
            unique=False,
        )
        op.create_index(
            op.f("ix_user_tips_signature"), "user_tips", ["signature"], unique=False
        )

    # AGGREGATE USER TIPS
    if not table_exists("aggregate_user_tips"):
        op.create_table(
            "aggregate_user_tips",
            sa.Column("sender_user_id", sa.Integer(), nullable=False),
            sa.Column("receiver_user_id", sa.Integer(), nullable=False),
            sa.Column("amount", sa.BigInteger(), nullable=False),
            sa.PrimaryKeyConstraint("sender_user_id", "receiver_user_id"),
        )
        op.create_index(
            op.f("ix_aggregate_user_tips_receiver_user_id"),
            "aggregate_user_tips",
            ["receiver_user_id"],
            unique=False,
        )


def downgrade():
    op.drop_index(
        op.f("ix_aggregate_user_tips_receiver_user_id"),
        table_name="aggregate_user_tips",
    )
    op.drop_table("aggregate_user_tips")
    op.drop_index(op.f("ix_user_tips_signature"), table_name="user_tips")
    op.drop_index(op.f("ix_user_tips_receiver_user_id"), table_name="user_tips")
    op.drop_table("user_tips")
