"""Drop old trending challenges

Revision ID: 7104383ac0fe
Revises: be27a2794f75
Create Date: 2022-01-14 21:07:15.939210

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7104383ac0fe'
down_revision = 'be27a2794f75'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        --- Drop user challenges
        delete from user-challenges 
        where 
            challenge_id = 'trending-track' or 
            challenge_id = 'trending-playlist' or
            challenge_id = 'trending-underground-track';

        --- Drop challenges
        delete from challenges 
        where 
            challenge_id = 'trending-track' or 
            challenge_id = 'trending-playlist' or
            challenge_id = 'trending-underground-track';
        """
    )

def downgrade():
    pass
