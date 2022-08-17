"""track trigger update
Revision ID: 5d3f95470222
Revises: f1e86fba0357
Create Date: 2022-08-17 14:06:25.596816
"""
import sqlalchemy as sa
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = '5d3f95470222'
down_revision = 'f1e86fba0357'
branch_labels = None
depends_on = None

inner_sql = build_sql(["handle_track.sql"], raw_sql=True)

full_sql = sa.text(f'''
begin;
drop trigger if exists on_track on tracks;
{inner_sql}
-- trigger trigger for is_available=false tracks
update tracks
    set is_available=is_available
    where is_current=true and is_available=false;
commit;
''')

def upgrade():
    connection = op.get_bind()
    connection.execute(full_sql)


def downgrade():
    connection = op.get_bind()
    connection.execute(full_sql)
    