"""add skipped_transaction level column

Revision ID: f775fb87f5ff
Revises: be27a2794f75
Create Date: 2022-01-12 22:32:24.949547

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f775fb87f5ff"
down_revision = "be27a2794f75"
branch_labels = None
depends_on = None


def upgrade():
    skippedtransactionlevel = sa.Enum("node", "network", name="skippedtransactionlevel")
    skippedtransactionlevel.create(op.get_bind())
    op.add_column(
        "skipped_transactions",
        sa.Column(
            "level",
            sa.Enum("node", "network", name="skippedtransactionlevel"),
            nullable=True,
        ),
    )
    op.execute("UPDATE skipped_transactions SET level = network")
    op.alter_column("skipped_transactions", "level", nullable=False)


def downgrade():
    op.drop_column("skipped_transactions", "level")
    bind = op.get_bind()
    sa.Enum(name="skippedtransactionlevel").drop(bind, checkfirst=False)
