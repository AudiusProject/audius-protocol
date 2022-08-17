"""track trigger update

Revision ID: 5d3f95470222
Revises: f1e86fba0357
Create Date: 2022-08-17 14:06:25.596816

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '5d3f95470222'
down_revision = 'f1e86fba0357'
branch_labels = None
depends_on = None

def upgrade():
    connection = op.get_bind()
    connection.execute(sa.text('''
    begin;

    drop trigger on_track on tracks;

    create trigger on_track
    after insert or update on tracks
    for each row execute procedure handle_track();

    commit;
    '''))


def downgrade():
    connection = op.get_bind()
    connection.execute(sa.text('''
    begin;

    drop trigger on_track on tracks;

    create trigger on_track
    after insert or update on tracks
    for each row execute procedure handle_track();

    commit;
    '''))
