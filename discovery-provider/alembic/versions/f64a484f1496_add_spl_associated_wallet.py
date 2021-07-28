"""add spl associated wallet

Revision ID: f64a484f1496
Revises: 2e02a681aeaa
Create Date: 2021-07-21 15:58:05.108372

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f64a484f1496'
down_revision = '2e02a681aeaa'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "user_balances",
        sa.Column(
            "associated_spl_wallets_balance",
            sa.String(),
            server_default="0",
            nullable=False,
        ),
    )
    wallet_chain = postgresql.ENUM('eth', 'spl', name='wallet_chain')
    wallet_chain.create(op.get_bind())

    op.add_column(
        "associated_wallets",
        sa.Column(
            "chain",
            sa.Enum("eth", "spl", name="wallet_chain"),
            server_default="eth",
            nullable=False,
        ),
    )
    op.alter_column('associated_wallets', 'chain', server_default=None)


def downgrade():
    op.drop_column("user_balances", "associated_spl_wallets_balance")
    op.drop_column("associated_wallets", "chain")
    wallet_chain = postgresql.ENUM('eth', 'spl', name='wallet_chain')
    wallet_chain.drop(op.get_bind())
