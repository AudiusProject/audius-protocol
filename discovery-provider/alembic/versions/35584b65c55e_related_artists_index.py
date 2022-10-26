"""related artists index

Revision ID: 35584b65c55e
Revises: 90ad232bfe92
Create Date: 2022-08-03 16:05:59.643702

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "35584b65c55e"
down_revision = "90ad232bfe92"
branch_labels = None
depends_on = None


def upgrade():
    sql = sa.text(
        """
    begin;
    drop index if exists "ix_related_artists_user_id";
    create index if not exists "related_artists_related_artist_id_idx" on "related_artists" ("related_artist_user_id", "user_id");
    end;
    """
    )
    op.get_bind().execute(sql)


def downgrade():
    sql = sa.text(
        """
    begin;
    drop index if exists "related_artists_related_artist_id_idx";
    create index if not exists "ix_related_artists_user_id" on "related_artists" ("user_id");
    end;
    """
    )
    op.get_bind().execute(sql)
