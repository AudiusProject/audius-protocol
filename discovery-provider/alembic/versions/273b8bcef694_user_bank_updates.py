"""user bank updates

Revision ID: 273b8bcef694
Revises: 6cf091d52869
Create Date: 2021-06-22 17:22:00.102134

"""
import logging
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker
from solana.publickey import PublicKey
from src.models import User
from src.utils.solana import get_address_pair

logger = logging.getLogger(__name__)

# revision identifiers, used by Alembic.
revision = "273b8bcef694"
down_revision = "6cf091d52869"
branch_labels = None
depends_on = None

Session = sessionmaker()


def upgrade():
    op.create_table(
        "user_bank_txs",
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("signature"),
    )
    op.create_table(
        "user_bank_accounts",
        sa.Column("signature", sa.String(), nullable=False),
        sa.Column("ethereum_address", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("bank_account", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("signature"),
    )

    op.add_column(
        "user_balances",
        sa.Column("waudio", sa.String(), server_default="0", nullable=True),
    )

    # ix_users_wallet exists on users table
    op.create_index(
        op.f("idx_user_bank_eth_address"),
        "user_bank_accounts",
        ["ethereum_address"],
        unique=True,
    )


def downgrade():
    op.drop_index(op.f("idx_user_bank_eth_address"), table_name="user_bank_accounts")
    op.drop_table("user_bank_txs")
    op.drop_table("user_bank_accounts")
    op.drop_column("user_balances", "waudio")
