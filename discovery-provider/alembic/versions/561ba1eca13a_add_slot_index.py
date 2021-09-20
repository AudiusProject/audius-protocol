"""Add Slot Index

Revision ID: 561ba1eca13a
Revises: 7693ab16e2e1
Create Date: 2021-09-20 21:06:07.682836

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "561ba1eca13a"
down_revision = "7693ab16e2e1"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(op.f("ix_plays_slot"), "plays", ["slot"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_plays_slot"), table_name="plays")
