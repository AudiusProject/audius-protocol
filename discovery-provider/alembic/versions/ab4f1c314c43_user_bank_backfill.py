"""user_bank_backfill

Revision ID: ab4f1c314c43
Revises: 03dbd1b775c5
Create Date: 2022-10-31 23:05:10.795098

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ab4f1c314c43"
down_revision = "03dbd1b775c5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_bank_backfill_txs",
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("signature"),
    )

    # idx_user_bank_txs_slots slots
    op.create_index(
        op.f("idx_user_bank_backfill_txs_slot"),
        "user_bank_backfill_txs",
        ["slot"],
        unique=False,
    )


def downgrade():
    op.drop_table("user_bank_backfill_txs")
    op.drop_index(
        op.f("idx_user_bank_backfill_txs_slot"),
        table_name="user_bank_backfill_txs",
        info={"if_exists": True},
    )
