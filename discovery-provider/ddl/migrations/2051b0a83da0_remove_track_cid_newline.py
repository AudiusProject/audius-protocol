"""remove track cid newline

Revision ID: 2051b0a83da0
Revises: 9f5539bdd5bc
Create Date: 2023-04-06 16:25:11.496186

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '2051b0a83da0'
down_revision = '9f5539bdd5bc'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        UPDATE tracks
        SET track_cid = regexp_replace(track_cid, E'[\\n]+$', '', 'g')
        WHERE is_current is true AND track_cid like E'%\n';
        """
    )


def downgrade():
    pass
