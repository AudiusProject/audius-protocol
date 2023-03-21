"""add-track-cid

Revision ID: 959f15b94094
Revises: bead88b41a20
Create Date: 2022-11-08 00:39:38.797185

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "959f15b94094"
down_revision = "bead88b41a20"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "tracks",
        sa.Column("track_cid", sa.String(), nullable=True),
    )

    connection = op.get_bind()
    connection.execute(
        """
        begin;
            CREATE INDEX IF NOT EXISTS tracks_track_cid_idx ON tracks (track_cid, is_current, is_delete);
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            DROP INDEX IF EXISTS tracks_track_cid_idx;
        commit;
    """
    )

    op.drop_column("tracks", "track_cid")
