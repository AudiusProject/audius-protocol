"""remove disbursement fk

Revision ID: 85680793a611
Revises: 132955202f03
Create Date: 2022-01-10 21:46:25.228543

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '85680793a611'
down_revision = '132955202f03'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        --- Lose problematic FK
        ALTER TABLE challenge_disbursements
        DROP CONSTRAINT fk_disbursement;
        """
    )


def downgrade():
    pass
