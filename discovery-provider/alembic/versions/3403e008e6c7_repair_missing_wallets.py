"""repair-missing-wallets

Revision ID: 3403e008e6c7
Revises: 9931f7fd118f
Create Date: 2022-08-08 19:45:39.391707

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "3403e008e6c7"
down_revision = "9931f7fd118f"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        """
      begin;

      update associated_wallets
      set is_delete = false
      where
        is_delete = true and
        is_current = true and
        -- July-14-2022 03:15:40 PM +-7 UTC
        blocknumber > 28370000 and
        -- August-08-2022 12:44:00 PM +-7 UTC
        blocknumber < 28754688 and
        user_id in (select user_id from associated_wallets where is_delete = false);

      update users
      set has_collectibles = true
      where
        has_collectibles = false and
        is_current = true and
        -- July-14-2022 03:15:40 PM +-7 UTC
        blocknumber > 28370000 and
        -- August-08-2022 12:44:00 PM +-7 UTC
        blocknumber < 28754688 and
        user_id in (select user_id from users where has_collectibles = true);

      commit;
    """
    )


def downgrade():
    pass
