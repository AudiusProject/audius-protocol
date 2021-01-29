"""balance_cache

Revision ID: a88a8ce41f7d
Revises: f82eb376f471
Create Date: 2021-01-19 16:09:39.121460

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a88a8ce41f7d'
down_revision = 'f82eb376f471'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('user_balances',
        sa.Column('user_id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('balance', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )


def downgrade():
    op.drop_table('user_balances')
