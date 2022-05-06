"""index reactions

Revision ID: 35198266d709
Revises: 5ea8fd4ae1fb
Create Date: 2022-05-04 19:53:54.350351

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "35198266d709"
down_revision = "5ea8fd4ae1fb"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "reactions",
        sa.Column("id", sa.Integer(), nullable=False, autoincrement=True),
        sa.Column("slot", sa.Integer(), nullable=False),
        sa.Column("reaction", sa.Integer(), nullable=False),
        sa.Column("sender_wallet", sa.String(), nullable=False),
        sa.Column("entity_type", sa.String(), nullable=False),
        sa.Column("entity_id", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("tx_signature", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        info={"if_not_exists": True},
    )

    op.create_index(
        op.f("ix_reactions_slot"),
        "reactions",
        ["slot"],
        unique=False,
        info={"if_not_exists": True},
    )


def downgrade():
    op.drop_table("reactions")
    op.drop_index(
        op.f("ix_reactions_slot"), table_name="reactions", info={"if_exists": True}
    )
