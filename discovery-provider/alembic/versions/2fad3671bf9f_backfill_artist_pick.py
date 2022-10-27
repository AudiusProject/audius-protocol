"""backfill_artist_pick

Revision ID: 2fad3671bf9f
Revises: a8752810936c
Create Date: 2022-10-27 02:14:19.935610

"""
from pathlib import Path

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2fad3671bf9f'
down_revision = 'a8752810936c'
branch_labels = None
depends_on = None

def load_data(file_name):
    path = Path(__file__).parent.joinpath(f"../csvs/{file_name}")
    with open(path, 'r') as f:
        return f.readlines()

def build_sql(up):
    data = load_data("test_user_pinned_track_ids.csv")
    inner_sql = []
    for entry in data:
        handle, pinned_track_id = entry.split(",")
        if up:
            sql = f"UPDATE users SET artist_pick_track_id = {pinned_track_id} where is_current = True and handle = '{handle}';"
        else:
            sql = f"UPDATE users SET artist_pick_track_id = null where is_current = True and handle = '{handle}';"
        inner_sql.append(sql)
    return sa.text("begin; \n\n " + "\n".join(inner_sql) + " \n\n commit;")

def upgrade():
    connection = op.get_bind()
    connection.execute(build_sql(True))

def downgrade():
    connection = op.get_bind()
    connection.execute(build_sql(False))
