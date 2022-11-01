"""Rebuild aggregate monthly plays table

Revision ID: f91c041d1d8d
Revises: 42d5afb85d42
Create Date: 2022-11-01 21:39:58.467895

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker


# revision identifiers, used by Alembic.
revision = 'f91c041d1d8d'
down_revision = '42d5afb85d42'
branch_labels = None
depends_on = None

Session = sessionmaker()

def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)
    session.execute(sa.text("DELETE FROM indexing_checkpoints WHERE tablename = 'aggregate_monthly_plays'"))

    session.execute(sa.text("TRUNCATE TABLE aggregate_monthly_plays"))


def downgrade():
    pass
