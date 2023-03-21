"""spl_token_backfill

Revision ID: 93fc0b994aba
Revises: fcb40409e0a4
Create Date: 2022-11-01 05:59:50.434959

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "93fc0b994aba"
down_revision = "fcb40409e0a4"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "spl_token_backfill_txs",
        sa.Column("last_scanned_slot", sa.Integer(), nullable=False),
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("last_scanned_slot"),
    )


def downgrade():
    op.drop_table("spl_token_backfill_txs")
