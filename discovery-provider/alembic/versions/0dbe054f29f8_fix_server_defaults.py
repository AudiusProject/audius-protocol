"""fix server defaults

Revision ID: 0dbe054f29f8
Revises: 60cc872cd012
Create Date: 2022-07-01 23:39:09.261136

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0dbe054f29f8"
down_revision = "60cc872cd012"
branch_labels = None
depends_on = None


def upgrade():
    """
    This migration fixes tables that were not correctly constructed with server defaults
    """
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE "eth_blocks" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "eth_blocks" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "skipped_transactions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "skipped_transactions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "skipped_transactions" ALTER COLUMN "level" SET DEFAULT 'node';

        ALTER TABLE "aggregate_daily_app_name_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_daily_app_name_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_daily_total_users_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_daily_total_users_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_daily_unique_users_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_daily_unique_users_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_monthly_app_name_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_monthly_app_name_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_monthly_total_users_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_monthly_total_users_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_monthly_unique_users_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "aggregate_monthly_unique_users_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "app_name_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "app_name_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "app_name_metrics" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "route_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "route_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "route_metrics" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "route_metrics" ALTER COLUMN "query_string" SET DEFAULT '';

        ALTER TABLE "app_name_metrics" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "app_name_metrics" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "aggregate_monthly_plays" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "plays" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "plays" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        
        ALTER TABLE "plays_archive" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "plays_archive" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "plays_archive" ALTER COLUMN "archived_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "related_artists" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "users" ALTER COLUMN "is_creator" SET DEFAULT false;
        ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "user_balances" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "user_balances" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "user_balance_changes" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "user_balance_changes" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE "user_events" ALTER COLUMN "is_mobile_user" SET DEFAULT false;

        ALTER TABLE "user_tips" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE "user_tips" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
        """
    )


def downgrade():
    pass
