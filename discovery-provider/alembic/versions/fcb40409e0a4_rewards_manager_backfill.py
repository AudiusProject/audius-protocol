"""rewards_manager_backfill

Revision ID: fcb40409e0a4
Revises: ab4f1c314c43
Create Date: 2022-11-01 04:01:38.951152

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "fcb40409e0a4"
down_revision = "ab4f1c314c43"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "rewards_manager_backfill_txs",
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("signature"),
    )

    # idx_user_bank_txs_slots slots
    op.create_index(
        op.f("idx_rewards_manager_backfill_txs_slot"),
        "rewards_manager_backfill_txs",
        ["slot"],
        unique=False,
    )


def downgrade():
    op.drop_table("rewards_manager_backfill_txs")
    op.drop_index(
        op.f("idx_rewards_manager_backfill_txs_slot"),
        table_name="rewards_manager_backfill_txs",
        info={"if_exists": True},
    )
