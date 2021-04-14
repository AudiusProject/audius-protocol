"""add_indexes

Revision ID: 2ff46a8686fa
Revises: bff7853e0983
Create Date: 2021-04-13 10:40:58.154737

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2ff46a8686fa'
down_revision = 'bff7853e0983'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()

    connection.execute('''
        begin;
            CREATE INDEX save_user_id_idx ON saves (user_id, is_delete, is_current, save_type);
            CREATE INDEX save_item_id_idx ON saves (save_item_id, is_delete, is_current, save_type);
            CREATE INDEX repost_user_id_idx ON reposts (user_id, is_delete, is_current, repost_type);
            CREATE INDEX repost_item_id_idx ON reposts (repost_item_id, is_delete, is_current, repost_type);
        commit;
    ''')


def downgrade():
    connection = op.get_bind()

    connection.execute('''
        begin;
            DROP INDEX save_user_id_idx;
            DROP INDEX save_item_id_idx;
            DROP INDEX repost_user_id_idx;
            DROP INDEX repost_item_id_idx;
        commit;
    ''')
