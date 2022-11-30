"""restart_audio_tx_hist_indexing

Revision ID: 0a6d444d8192
Revises: 1eec1d124caf
Create Date: 2022-11-20 19:42:21.304552

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0a6d444d8192"
down_revision = "1eec1d124caf"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    query = """
        delete from audio_transactions_history;
        delete from user_bank_backfill_txs;
        delete from rewards_manager_backfill_txs;
        delete from indexing_checkpoints where tablename in ('index_user_bank_backfill','index_rewards_manager_backfill','index_spl_token_backfill');
        """
    connection.execute(query)

    op.drop_table("spl_token_backfill_txs")
    op.create_table(
        "spl_token_backfill_txs_v2",
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("signature"),
    )


def downgrade():
    op.drop_table("spl_token_backfill_txs_v2")
    op.create_table(
        "spl_token_backfill_txs",
        sa.Column("last_scanned_slot", sa.Integer(), nullable=False),
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("last_scanned_slot"),
    )
