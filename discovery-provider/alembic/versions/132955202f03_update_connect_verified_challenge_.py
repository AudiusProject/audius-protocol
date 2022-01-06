"""update connect verified challenge backfill

Revision ID: 132955202f03
Revises: a41727360622
Create Date: 2022-01-06 15:29:54.081225

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "132955202f03"
down_revision = "a41727360622"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            -- Remove all old connect-verified user_challenges
            delete from user_challenges where challenge_id='connect-verified';

            -- Retroactively add connect-verified user_challenges
            insert into user_challenges (challenge_id, user_id, specifier, is_complete, completed_blocknumber)
            select 
                'connect-verified' as challenge_id,
                u.user_id as user_id,
                u.user_id as specifier,
                True as is_complete,
                1 as completed_blocknumber
            from users u
            where u.is_verified is True AND u.is_current is True;
        commit;
        """
    )


def downgrade():
    pass
