"""Wipe plays table

Revision ID: 83e9edcc7014
Revises: ffcb2df7b0ee
Create Date: 2020-09-15 17:07:41.777345

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '83e9edcc7014'
down_revision = '4c3784d41d41'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute('''
        --- Drop all plays
        DELETE plays;
    ''')


def downgrade():
    ### No going back from this one...
    pass
