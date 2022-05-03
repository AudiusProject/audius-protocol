"""Supporter Rank Ups

Revision ID: 5ea8fd4ae1fb
Revises: 378ef6680606
Create Date: 2022-04-29 03:01:37.097134

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5ea8fd4ae1fb"
down_revision = "378ef6680606"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "supporter_rank_ups",
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("sender_user_id", sa.Integer(), nullable=False),
        sa.Column("receiver_user_id", sa.Integer(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("slot", "sender_user_id", "receiver_user_id"),
        info={"if_not_exists": True},
    )
    op.create_index(
        op.f("ix_supporter_rank_ups_receiver_user_id"),
        "supporter_rank_ups",
        ["receiver_user_id"],
        unique=False,
        info={"if_not_exists": True},
    )
    op.create_index(
        op.f("ix_supporter_rank_ups_sender_user_id"),
        "supporter_rank_ups",
        ["sender_user_id"],
        unique=False,
        info={"if_not_exists": True},
    )
    op.create_index(
        op.f("ix_supporter_rank_ups_slot"),
        "supporter_rank_ups",
        ["slot"],
        unique=False,
        info={"if_not_exists": True},
    )
    # ### end Alembic commands ###


def downgrade():
    op.drop_index(
        op.f("ix_supporter_rank_ups_slot"),
        table_name="supporter_rank_ups",
        info={"if_exists": True},
    )
    op.drop_index(
        op.f("ix_supporter_rank_ups_sender_user_id"),
        table_name="supporter_rank_ups",
        info={"if_exists": True},
    )
    op.drop_index(
        op.f("ix_supporter_rank_ups_receiver_user_id"),
        table_name="supporter_rank_ups",
        info={"if_exists": True},
    )
    op.drop_table("supporter_rank_ups", info={"if_exists": True})
    # ### end Alembic commands ###
