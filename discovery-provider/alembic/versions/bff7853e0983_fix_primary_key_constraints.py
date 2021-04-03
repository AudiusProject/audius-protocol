'''fix_primary_key_constraints

Revision ID: bff7853e0983
Revises: 8a07fa2fe97b
Create Date: 2021-04-03 11:51:24.385460

'''
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bff7853e0983'
down_revision = '8a07fa2fe97b'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()

    connection.execute('''
        begin;
            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users ADD COLUMN txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (is_current, user_id, blockhash, txhash);

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes ADD COLUMN txhash VARCHAR DEFAULT('') NOT NULL;
            ALTER TABLE ursm_content_nodes ADD CONSTRAINT ursm_content_nodes_pkey PRIMARY KEY (is_current, cnode_sp_id, blockhash, txhash);
        commit;
    ''')


def downgrade():
    connection = op.get_bind()

    connection.execute('''
        begin;
            ALTER TABLE users DROP CONSTRAINT users_pkey;
            ALTER TABLE users DROP COLUMN txhash;
            ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (is_current, user_id, blockhash);

            ALTER TABLE ursm_content_nodes DROP CONSTRAINT ursm_content_nodes_pkey;
            ALTER TABLE ursm_content_nodes DROP COLUMN txhash;
            ALTER TABLE ursm_content_nodes ADD CONSTRAINT ursm_content_nodes_pkey PRIMARY KEY (is_current, cnode_sp_id, blockhash);
        commit;
    ''')
