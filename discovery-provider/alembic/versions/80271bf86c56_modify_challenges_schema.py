"""Modify challenges schema

Revision ID: 80271bf86c56
Revises: 301b1e42dc4b
Create Date: 2021-06-28 19:31:27.094479

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "80271bf86c56"
down_revision = "301b1e42dc4b"
branch_labels = None
depends_on = None


def upgrade():
    # Update disbursements to use compound FK
    op.drop_constraint(
        "challenge_disbursements_challenge_id_fkey",
        "challenge_disbursements",
        "foreignkey",
    )
    op.create_foreign_key(
        "fk_disbursement",
        "challenge_disbursements",
        "user_challenges",
        ["challenge_id", "specifier"],
        ["challenge_id", "specifier"],
    )

    with op.get_context().autocommit_block():
        # Can't alter enums in transactions
        # https://alembic.sqlalchemy.org/en/latest/api/runtime.html#alembic.runtime.migration.MigrationContext.autocommit_block
        op.execute("ALTER TYPE challengetype ADD value 'aggregate' after 'numeric'")
        op.execute("ALTER TYPE challengetype ADD value 'trending' after 'aggregate'")


def downgrade():
    # Update disbursements
    op.drop_constraint("fk_disbursement", "challenge_disbursements", "foreignkey")
