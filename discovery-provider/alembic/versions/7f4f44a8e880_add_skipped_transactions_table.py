"""add-skipped-transactions-table

Revision ID: 7f4f44a8e880
Revises: 6cf96b71cf3d
Create Date: 2021-05-24 20:14:46.963239

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7f4f44a8e880'
down_revision = '6cf96b71cf3d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('skipped_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False, autoincrement=True),
        sa.Column('blocknumber', sa.Integer(), nullable=False),
        sa.Column('blockhash', sa.String(), nullable=False),
        sa.Column('transactionhash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, default=sa.func.now(), onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('skipped_transactions')
