"""remove_stems_and_remixes_unique_constraints

Revision ID: d579207034fc
Revises: 281de8af4b93
Create Date: 2020-10-26 21:25:20.393863

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d579207034fc"
down_revision = "281de8af4b93"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        ALTER TABLE stems
        DROP CONSTRAINT IF EXISTS stems_pkey
    """
    )
    connection.execute(
        """
        ALTER TABLE remixes
        DROP CONSTRAINT IF EXISTS remixes_pkey
    """
    )


def downgrade():
    op.create_primary_key("stems_pkey", "stems", ["parent_track_id", "child_track_id"])
    op.create_primary_key(
        "remixes_pkey", "remixes", ["parent_track_id", "child_track_id"]
    )
