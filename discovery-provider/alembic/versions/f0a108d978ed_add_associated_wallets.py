"""add associated wallets

Revision ID: f0a108d978ed
Revises: c967ae0fcaf6
Create Date: 2021-03-09 15:34:32.229219

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f0a108d978ed'
down_revision = 'c967ae0fcaf6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('associated_wallets',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('wallet', sa.String(), nullable=False),
        sa.Column('blockhash', sa.String(), nullable=False),
        sa.Column('blocknumber', sa.Integer(), nullable=False),
        sa.Column('is_current', sa.Boolean(), nullable=False),
        sa.Column('is_delete', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_associated_wallets_user_id'), 'associated_wallets', ['user_id', 'is_current'], unique=False)
    op.create_index(op.f('ix_associated_wallets_wallet'), 'associated_wallets', ['wallet', 'is_current'], unique=False)

def downgrade():
    op.drop_table('associated_wallets')
