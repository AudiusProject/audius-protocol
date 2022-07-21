"""fix_ray_account

Revision ID: ab56e2d974a6
Revises: 08becec375f3
Create Date: 2022-07-21 15:24:49.790954

"""
from alembic import op
from sqlalchemy.orm import sessionmaker

# revision identifiers, used by Alembic.
revision = 'ab56e2d974a6'
down_revision = '08becec375f3'
branch_labels = None
depends_on = None

Session = sessionmaker()

def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)
    res = session.execute("select wallet from users where user_id = 987591")
    oldWallet = res.fetchall()[0][0]
    op.execute("update users set wallet = '0x1111111111222222222233333333334444444444' where user_id = 987591;")
    op.execute("update user_bank_accounts set ethereum_address = '0x1111111111222222222233333333334444444444' where ethereum_address = '{}';".format(oldWallet))


def downgrade():
    pass
