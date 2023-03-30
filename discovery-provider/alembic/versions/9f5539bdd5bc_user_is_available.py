"""user_is_available

Revision ID: 9f5539bdd5bc
Revises: 02295bdb6bca
Create Date: 2023-03-29 12:42:11.193802

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "9f5539bdd5bc"
down_revision = "02295bdb6bca"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            alter table users
            add column if not exists is_available boolean not null default true;
        commit;
        """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            alter table users
            drop column if exists is_available;
        commit;
        """
    )
