"""Add aggregate metrics tables

Revision ID: c967ae0fcaf6
Revises: 579360c7cbf3
Create Date: 2021-02-24 17:45:45.939947

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c967ae0fcaf6"
down_revision = "5dd6a55bb738"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "aggregate_daily_unique_users_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "aggregate_daily_total_users_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "aggregate_monthly_unique_users_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "aggregate_monthly_total_users_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "aggregate_daily_app_name_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("application_name", sa.String(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "aggregate_monthly_app_name_metrics",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("application_name", sa.String(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("aggregate_daily_unique_users_metrics")
    op.drop_table("aggregate_daily_total_users_metrics")
    op.drop_table("aggregate_monthly_unique_users_metrics")
    op.drop_table("aggregate_monthly_total_users_metrics")
    op.drop_table("aggregate_daily_app_name_metrics")
    op.drop_table("aggregate_monthly_app_name_metrics")
