"""ix_plays_created_at

Revision ID: 7857f02c8438
Revises: 92571f94989a
Create Date: 2021-10-13 17:39:36.424969

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7857f02c8438'
down_revision = '92571f94989a'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()

    connection.execute(
        """
        begin;
            CREATE INDEX IF NOT EXISTS "ix_plays_created_at" ON "plays" ("created_at");
        commit;
    """
    )


def downgrade():
    connection = op.get_bind()

    connection.execute(
        """
        begin;
            DROP INDEX ix_plays_created_at;
        commit;
    """
    )
