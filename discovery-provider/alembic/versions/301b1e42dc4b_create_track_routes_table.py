"""create track routes table

Revision ID: 301b1e42dc4b
Revises: 05e2eeb2bd03
Create Date: 2021-06-09 20:51:52.531039

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '301b1e42dc4b'
down_revision = '05e2eeb2bd03'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('track_routes',
        sa.Column('owner_id', sa.Integer(), nullable=False, index=False),
        sa.Column('track_id', sa.Integer(), nullable=False, index=False),
        sa.Column('slug', sa.String(), nullable=False, index=False),
        sa.PrimaryKeyConstraint('owner_id', 'slug')
    )


def downgrade():
    op.drop_table('track_routes')
