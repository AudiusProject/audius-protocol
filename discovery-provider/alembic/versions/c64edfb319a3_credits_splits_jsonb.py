"""credits-splits-jsonb

Revision ID: c64edfb319a3
Revises: b3084b7bc025
Create Date: 2020-04-29 11:41:50.041780

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c64edfb319a3'
down_revision = 'b3084b7bc025'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('tracks', 'credits_splits')
    op.add_column('tracks', sa.Column('credits_splits', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    op.drop_column('tracks', 'credits_splits')
    op.add_column('tracks', sa.Column('credits_splits', postgresql.VARCHAR(), nullable=True))
