"""add-eth-indexing-blocks-table

Revision ID: 2e02a681aeaa
Revises: 534987cb0355
Create Date: 2021-07-16 10:56:11.926274

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2e02a681aeaa"
down_revision = "534987cb0355"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "eth_blocks",
        sa.Column("last_scanned_block", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("last_scanned_block"),
    )


def downgrade():
    op.drop_table("eth_blocks")
