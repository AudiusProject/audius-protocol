"""solana slot playlists

Revision ID: a9215207bb7c
Revises: 3a3f2c9f5320
Create Date: 2022-04-10 20:15:18.454483

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = ""
down_revision = ""
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        BEGIN;
            UPDATE tracks SET track_cid = sb.track_cid
            FROM (
                -- all tracks with no current track_cid but do have an old one
                SELECT DISTINCT track_id, track_cid
                FROM tracks 
                WHERE track_cid IS NOT NULL
                WHERE track_id IN (
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
    connection = op.get_bind()
    connection.execute(
        """
        BEGIN;

        COMMIT;
    """
    )
