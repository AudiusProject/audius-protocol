"""Create Metrics Routes Table

Revision ID: f54b539b0527
Revises: 776ca72b16db
Create Date: 2020-07-31 09:41:14.132668

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f54b539b0527"
down_revision = "776ca72b16db"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "route_metrics",
        sa.Column("route_path", sa.String(), nullable=False),
        sa.Column("version", sa.String(), nullable=False),
        sa.Column("query_string", sa.String(), nullable=False, default=""),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("route_path", "query_string", "timestamp"),
    )
    op.create_table(
        "app_name_metrics",
        sa.Column("application_name", sa.String(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("created_at", sa.DateTime, nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint("application_name", "timestamp"),
    )


def downgrade():
    op.drop_table("route_metrics")
    op.drop_table("app_name_metrics")
