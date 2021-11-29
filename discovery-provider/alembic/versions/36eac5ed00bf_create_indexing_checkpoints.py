"""create indexing checkpoints table

Revision ID: 36eac5ed00bf
Revises: edccccc274a7
Create Date: 2021-11-29 22:12:54.657724

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '36eac5ed00bf'
down_revision = 'edccccc274a7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "indexing_checkpoints",
        sa.Column("tablename", sa.String(), nullable=False),
        sa.Column("last_index", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("tablename"),
    )

def downgrade():
    op.drop_table("indexing_checkpoints")
