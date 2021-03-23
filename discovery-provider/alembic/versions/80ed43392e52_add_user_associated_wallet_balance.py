"""add user associated wallet balance

Revision ID: 80ed43392e52
Revises: 5a2f90f7def1
Create Date: 2021-03-16 15:05:06.396266

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '80ed43392e52'
down_revision = '5a2f90f7def1'
branch_labels = None
depends_on = None


def upgrade():
  op.add_column('user_balances', sa.Column('associated_wallets_balance', sa.String(), server_default='0', nullable=False))


def downgrade():
  op.drop_column('user_balances', 'associated_wallets_balance')
