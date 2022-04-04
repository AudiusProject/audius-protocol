"""add is_current index to ipld blacklist

Revision ID: 626aa04489af
Revises: 042c55d0efda
Create Date: 2020-07-20 18:30:43.637217

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "626aa04489af"
down_revision = "042c55d0efda"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        op.f("is_current_ipld_blacklist_blocks_idx"),
        "ipld_blacklist_blocks",
        ["is_current"],
        unique=False,
    )


def downgrade():
    op.drop_index(
        op.f("is_current_ipld_blacklist_blocks_idx"), table_name="ipld_blacklist_blocks"
    )
