"""Add aggregate summed unique users columns

Revision ID: 1b9c292e14b9
Revises: 80ed43392e52
Create Date: 2021-03-30 14:33:50.700725

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1b9c292e14b9'
down_revision = '80ed43392e52'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('aggregate_daily_unique_users_metrics', sa.Column('summed_count', sa.Integer(), nullable=True))
    op.add_column('aggregate_monthly_unique_users_metrics', sa.Column('summed_count', sa.Integer(), nullable=True))


def downgrade():
    op.drop_column('aggregate_daily_unique_users_metrics', 'summed_count')
    op.drop_column('aggregate_monthly_unique_users_metrics', 'summed_count')
