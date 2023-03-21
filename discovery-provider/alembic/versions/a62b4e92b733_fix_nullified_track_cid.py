"""fix track_cid that were nullified when editted

Revision ID: a62b4e92b733
Revises: 72b030bb3dcb
Create Date: 2023-01-12 18:21:58.029182

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a62b4e92b733"
down_revision = "72b030bb3dcb"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        BEGIN;
            UPDATE tracks SET track_cid = sub.track_cid
            FROM (
                SELECT DISTINCT track_id, track_cid
                FROM tracks 
                WHERE track_cid IS NOT NULL
                AND track_id IN (
                    -- all current tracks with no track_cid
                    SELECT track_id 
                    FROM tracks 
                    WHERE is_current = TRUE 
                    AND is_delete = FALSE 
                    AND track_cid IS NULL
                )
            ) as sub
            WHERE tracks.track_id = sub.track_id;
        COMMIT;
    """
    )


def downgrade():
    pass
