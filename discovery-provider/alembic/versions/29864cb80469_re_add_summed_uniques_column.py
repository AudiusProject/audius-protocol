"""re_add_summed_uniques_column

Revision ID: 29864cb80469
Revises: 5bcbe23f6c70
Create Date: 2021-04-27 17:15:25.639631

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '29864cb80469'
down_revision = '5bcbe23f6c70'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute('''
    begin;
        ALTER TABLE "aggregate_daily_unique_users_metrics" ADD COLUMN IF NOT EXISTS "summed_count" INTEGER;
        ALTER TABLE "aggregate_monthly_unique_users_metrics" ADD COLUMN IF NOT EXISTS "summed_count" INTEGER;
    commit;
    ''')


def downgrade():
    # This migration has no downgrade, but can be run multiple times idempotently
    pass
