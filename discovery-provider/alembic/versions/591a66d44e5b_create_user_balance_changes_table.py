"""create_user_balance_changes_table

Revision ID: 591a66d44e5b
Revises: edccccc274a7
Create Date: 2021-10-01 16:24:24.444296

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '591a66d44e5b'
down_revision = 'edccccc274a7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_balance_changes",
        sa.Column("user_id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("blocknumber", sa.Integer(), nullable=False),
        sa.Column("current_balance", sa.String(), nullable=False),
        sa.Column("previous_balance", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, default=sa.func.now()),
    )


def downgrade():
    op.drop_table('user_balance_changes')
