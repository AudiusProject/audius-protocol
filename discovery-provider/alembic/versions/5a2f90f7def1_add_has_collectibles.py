"""add_has_collectibles

Revision ID: 5a2f90f7def1
Revises: f0a108d978ed
Create Date: 2021-03-11 17:58:56.428933

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5a2f90f7def1'
down_revision = 'f0a108d978ed'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('has_collectibles', sa.Boolean(), server_default='false', nullable=False))


def downgrade():
    op.drop_column('users', 'has_collectibles')
