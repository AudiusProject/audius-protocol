"""set-eth-start-block

Revision ID: 169519f975c2
Revises: b40b074a75be
Create Date: 2021-09-02 18:34:19.562514

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "169519f975c2"
down_revision = "b40b074a75be"
branch_labels = None
depends_on = None


def upgrade():
    # Update block to https://etherscan.io/block/12860853
    # if we have gone passed it.
    # This block was *before* the eth_blocks table was rolled out.
    op.execute(
        "UPDATE eth_blocks SET last_scanned_block = 12860853 WHERE last_scanned_block > 12860853"
    )


def downgrade():
    pass
