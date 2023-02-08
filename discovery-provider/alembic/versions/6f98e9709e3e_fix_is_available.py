"""fix_is_available

Revision ID: 6f98e9709e3e
Revises: a62b4e92b733
Create Date: 2023-02-08 03:33:50.227563

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '6f98e9709e3e'
down_revision = 'a62b4e92b733'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        UPDATE "tracks"
        SET "is_available" = true, "is_delete" = false
        WHERE "is_current" = true and "track_id" = 1783183467;

        UPDATE "tracks"
        SET "is_available" = true, "is_delete" = false
        WHERE "is_current" = true and "track_id" = 48325816;

        UPDATE "tracks"
        SET "is_available" = true, "is_delete" = false
        WHERE "is_current" = true and "track_id" = 1496592899;
        """
    )


def downgrade():
    pass
