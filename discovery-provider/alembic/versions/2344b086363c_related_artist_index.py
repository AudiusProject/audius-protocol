"""related_artist_index

Revision ID: 2344b086363c
Revises: 0dbe054f29f8
Create Date: 2022-07-14 17:15:09.641767

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "2344b086363c"
down_revision = "0dbe054f29f8"
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute(
        """
    begin;
    CREATE INDEX IF NOT EXISTS "related_artists_related_artist_id_idx" ON "related_artists" ("related_artist_user_id", "user_id");
    commit;
    """
    )


def downgrade():
    op.get_bind().execute(
        """
    begin;
    DROP INDEX IF EXISTS "related_artists_related_artist_id_idx";
    commit;
    """
    )
