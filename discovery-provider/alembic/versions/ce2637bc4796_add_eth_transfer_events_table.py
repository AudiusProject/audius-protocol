"""add-eth-transfer-events-table

Revision ID: ce2637bc4796
Revises: 80271bf86c56
Create Date: 2021-07-09 19:55:19.556399

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ce2637bc4796"
down_revision = "80271bf86c56"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "eth_transfer_events",
        sa.Column(
            "id", sa.Integer(), primary_key=True, nullable=False, autoincrement=True
        ),
        sa.Column("blocknumber", sa.Integer(), nullable=False),
        sa.Column("txhash", sa.String(), nullable=False),
        sa.Column("logindex", sa.Integer(), nullable=False),
        sa.Column("tx_from", sa.String(), nullable=False),
        sa.Column("tx_to", sa.String(), nullable=False),
        sa.Column("tx_timestamp", sa.DateTime(), nullable=False),
        sa.Column("value", sa.Float(precision=3), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("eth_transfer_events")
