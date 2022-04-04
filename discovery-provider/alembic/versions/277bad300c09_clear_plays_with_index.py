"""clear plays with index

Revision ID: 277bad300c09
Revises: f54b539b0527
Create Date: 2020-08-21 15:08:54.613477

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "277bad300c09"
down_revision = "f54b539b0527"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    # Delete all rows from the plays table to force re-indexing from the beginning
    connection.execute(
        """
        DELETE FROM plays
    """
    )

    # Create index on plays table with the play_item_id and user_id
    op.create_index(
        op.f("ix_plays_user_play_item"),
        "plays",
        ["play_item_id", "user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_plays_user_play_item_date"),
        "plays",
        ["play_item_id", "user_id", "created_at"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_plays_user_play_item"), table_name="plays")
    op.drop_index(op.f("ix_plays_user_play_item_date"), table_name="plays")
