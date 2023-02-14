"""update triggers for notifications

Revision ID: 0f75bcb73b0a
Revises: a62b4e92b733
Create Date: 2023-02-14 15:22:13.771266

"""
from alembic import op
from src.utils.alembic_helpers import build_sql

# revision identifiers, used by Alembic.
revision = '0f75bcb73b0a'
down_revision = 'a62b4e92b733'
branch_labels = None
depends_on = None

up_files = [
    "handle_repost.sql",
    "handle_reaction.sql",
    "handle_track.sql",
    "handle_user_tip.sql",
    "handle_user_balance_change.sql",
    "handle_supporter_rank_ups.sql"
]

def upgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
    conn.execute(
      """
      DELETE FROM notification where type in ('reaction', 'tip_send', 'tip_receive', 'create', 'tier_change');
      """
    )



def downgrade():
    sql = build_sql(up_files)
    connection = op.get_bind()
    connection.execute(sql)
