"""add indexes

Revision ID: 281de8af4b93
Revises: ffcb2df7b0ee
Create Date: 2020-09-28 15:27:40.389787

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "281de8af4b93"
down_revision = "ffcb2df7b0ee"
branch_labels = None
depends_on = None


def upgrade():
    # Add an index for track owner id on the tracks table
    op.create_index(op.f("track_owner_id_idx"), "tracks", ["owner_id"], unique=False)

    # Update the index on the aggregate_plays materialized view to be unique for concurrent updates
    connection = op.get_bind()
    connection.execute(
        """
        DROP INDEX play_item_id_idx;
        CREATE UNIQUE INDEX play_item_id_idx ON aggregate_plays (play_item_id);
    """
    )


def downgrade():
    # Drop the index for track owner id
    op.drop_index(op.f("track_owner_id_idx"), table_name="tracks")
    connection = op.get_bind()

    # Update the index on the aggregate_plays materialized view to not be unique
    connection.execute(
        """
        DROP INDEX play_item_id_idx;
        CREATE INDEX play_item_id_idx ON aggregate_plays (play_item_id);
    """
    )
