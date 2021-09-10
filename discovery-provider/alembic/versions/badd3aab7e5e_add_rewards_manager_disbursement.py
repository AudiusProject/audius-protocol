"""add-rewards-manager-disbursement

Revision ID: badd3aab7e5e
Revises: 9562cf365cf4
Create Date: 2021-08-05 13:50:52.864760

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "badd3aab7e5e"
down_revision = "9562cf365cf4"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint(
        "challenge_disbursements_block_number_fkey",
        "challenge_disbursements",
        "foreignkey",
    )
    op.drop_column("challenge_disbursements", "block_number")
    op.add_column(
        "challenge_disbursements",
        sa.Column("signature", sa.String(), nullable=False),
    )
    op.add_column(
        "challenge_disbursements",
        sa.Column("slot", sa.Integer(), nullable=False),
    )

    op.drop_column("challenge_disbursements", "amount")
    op.add_column(
        "challenge_disbursements",
        sa.Column("amount", sa.String(), nullable=False),
    )

    op.create_index(
        op.f("idx_challenge_disbursements_slot"),
        "challenge_disbursements",
        ["slot"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("idx_challenge_disbursements_slot"), table_name="challenge_disbursements"
    )
    op.drop_column("challenge_disbursements", "signature")
    op.drop_column("challenge_disbursements", "slot")

    op.add_column(
        "challenge_disbursements",
        sa.Column(
            "block_number", sa.Integer(), sa.ForeignKey("blocks.number"), nullable=False
        ),
    )

    op.drop_column("challenge_disbursements", "amount")
    op.add_column(
        "challenge_disbursements",
        sa.Column("amount", sa.Integer(), nullable=False),
    )
