"""Fix profile completion

Revision ID: b734b7b47fca
Revises: 49e904b2b9fd
Create Date: 2022-01-31 23:10:43.948187

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b734b7b47fca'
down_revision = '49e904b2b9fd'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        UPDATE user_challenges
        SET completed_blocknumber = 1
        WHERE 
            challenge_id = 'profile-completion' AND
            is_complete = TRUE AND
            completed_blocknumber IS NULL;
        """
    )


def downgrade():
    pass
