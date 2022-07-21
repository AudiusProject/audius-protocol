"""fix_ray_account

Revision ID: ab56e2d974a6
Revises: 08becec375f3
Create Date: 2022-07-21 15:24:49.790954

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'ab56e2d974a6'
down_revision = '08becec375f3'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("update users set wallet = '0x1111111111222222222233333333334444444444' where user_id = 987591;")


def downgrade():
    pass
