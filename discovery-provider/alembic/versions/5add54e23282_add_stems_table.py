"""add stems support

Revision ID: 5add54e23282
Revises: b3084b7bc025
Create Date: 2020-05-01 16:36:34.237413

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5add54e23282"
down_revision = "b3084b7bc025"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "stems",
        sa.Column("parent_track_id", sa.Integer(), nullable=False),
        sa.Column("child_track_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("parent_track_id", "child_track_id"),
    )


def downgrade():
    op.drop_table("stems")
