"""fix_broken_block

Revision ID: 8a07fa2fe97b
Revises: 1b9c292e14b9
Create Date: 2021-04-03 08:05:50.543984

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '8a07fa2fe97b'
down_revision = '1b9c292e14b9'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute('''
        begin;
        delete from users where user_id = 61019 and blockhash = '0x3a349f3d579e3af0c17c00026704370d5650e66d51ce7952aeac42de74c44cb3';
        update users set is_current = true where user_id = 61019 and blockhash = '0x933893c86647213de2c22d5080621888927ba404d4fb180a101d8310e90df02e';
        commit;
    ''')


def downgrade():
    pass
