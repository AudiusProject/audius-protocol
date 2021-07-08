"""Add indices to plays table

Revision ID: ffcb2df7b0ee
Revises: 83e9edcc7014
Create Date: 2020-09-15 13:27:54.686093

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "ffcb2df7b0ee"
down_revision = "83e9edcc7014"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f("play_updated_at_idx"), "plays", ["updated_at"], unique=False)
    op.create_index(op.f("play_item_idx"), "plays", ["play_item_id"], unique=False)


def downgrade():
    op.drop_index(op.f("play_updated_at_idx"), table_name="plays")
    op.drop_index(op.f("play_item_idx"), table_name="plays")
