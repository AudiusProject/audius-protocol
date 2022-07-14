"""remove ipld blacklist

Revision ID: b3f2c32a2796
Revises: 0dbe054f29f8
Create Date: 2022-07-05 22:28:30.562009

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "b3f2c32a2796"
down_revision = "0dbe054f29f8"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        DROP TABLE IF EXISTS ipld_blacklists;
        DROP TABLE IF EXISTS ipld_blacklist_blocks;
        """
    )


def downgrade():
    pass
