"""store cid

Revision ID: 6adee41cb531
Revises: 03dbd1b775c5
Create Date: 2022-10-31 14:08:49.888394

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '6adee41cb531'
down_revision = '03dbd1b775c5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "cid_data",
        sa.Column("cid", sa.String(), primary_key=True),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
    )


def downgrade():
    op.drop_table("cid_data")
