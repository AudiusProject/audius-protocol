"""fix_available_track

Revision ID: e97a5ba523fc
Revises: 5b4e01eaebab
Create Date: 2023-03-16 01:05:46.723418

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e97a5ba523fc"
down_revision = "5b4e01eaebab"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        UPDATE "tracks"
        SET "is_available" = true, "is_delete" = false
        WHERE "is_current" = true and "track_id" = 2006568431;

        UPDATE "tracks"
        SET "is_available" = false, "is_delete" = true
        WHERE "is_current" = true and "track_id" = 764026115;
        """
    )


def downgrade():
    pass
