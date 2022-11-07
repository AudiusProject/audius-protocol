"""create audio_transactions_history

Revision ID: 42d5afb85d42
Revises: a8752810936c
Create Date: 2022-10-03 18:29:24.661763

"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import table_exists

# revision identifiers, used by Alembic.
revision = "42d5afb85d42"
down_revision = "a8752810936c"
branch_labels = None
depends_on = None


def upgrade():
    # audio_transactions_history
    if not table_exists("audio_transactions_history"):
        op.create_table(
            "audio_transactions_history",
            sa.Column("user_bank", sa.String(), nullable=False),
            sa.Column("slot", sa.Integer(), nullable=False),
            sa.Column("signature", sa.String(), nullable=False),
            sa.Column("transaction_type", sa.String(), nullable=False),
            sa.Column("method", sa.String(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
            sa.Column(
                "updated_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.current_timestamp(),
            ),
            sa.Column(
                "transaction_created_at",
                sa.DateTime(),
                nullable=False,
            ),
            sa.Column("change", sa.Numeric(), nullable=False),
            sa.Column("balance", sa.Numeric(), nullable=False),
            sa.Column("tx_metadata", sa.String(), nullable=True),
            sa.PrimaryKeyConstraint("user_bank", "signature"),
        )
        op.create_index(
            op.f("ix_audio_transactions_history_transaction_type"),
            "audio_transactions_history",
            ["transaction_type"],
            unique=False,
        )
        op.create_index(
            op.f("ix_audio_transactions_history_slot"),
            "audio_transactions_history",
            ["slot"],
            unique=False,
        )


def downgrade():
    op.drop_index(
        op.f("ix_audio_transactions_history_transaction_type"),
        table_name="audio_transactions_history",
    )
    op.drop_index(
        op.f("ix_audio_transactions_history_slot"),
        table_name="audio_transactions_history",
    )
    op.drop_table("audio_transactions_history")
