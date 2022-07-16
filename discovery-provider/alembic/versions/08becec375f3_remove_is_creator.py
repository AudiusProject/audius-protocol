"""remove is_creator

Revision ID: 08becec375f3
Revises: b3f2c32a2796
Create Date: 2022-07-15 00:23:53.153082

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '08becec375f3'
down_revision = 'b3f2c32a2796'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            ALTER TABLE "users" DROP COLUMN IF EXISTS "is_creator";
        commit;
        """
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        """
        begin;
            ALTER TABLE "users" ADD COLUMN "is_creator" BOOLEAN DEFAULT false;
        commit;
        """
    )
