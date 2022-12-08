"""add_sig_to_indexing_checkpoints

Revision ID: 3e99d419fd63
Revises: 93fc0b994aba
Create Date: 2022-11-02 18:01:28.499717

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "3e99d419fd63"
down_revision = "93fc0b994aba"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "indexing_checkpoints", sa.Column("signature", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("indexing_checkpoints", "signature")
