"""Fix is_current for users and tracks due to entity manager invalidation

Revision ID: 1b6e405ef358
Revises: f6f009132212
Create Date: 2022-12-30 19:33:50.134305

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '1b6e405ef358'
down_revision = 'f6f009132212'
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        """
        update
            users
        set
            is_current = true
        from
            (
                select
                    user_id,
                    max_block
                from
                    (
                        select
                            user_id,
                            count(
                                CASE
                                    WHEN is_current THEN 1
                                END
                            ) as current_count,
                            max(blocknumber) as max_block
                        from
                            users
                        group by
                            user_id
                    ) current_users
                where
                    current_users.current_count < 1
            ) incorrect_users
        where
            incorrect_users.user_id = users.user_id
            and users.blocknumber = incorrect_users.max_block;

        update
            tracks
        set
            is_current = true
        from
            (
                select
                    track_id,
                    max_block
                from
                    (
                        select
                            track_id,
                            count(
                                CASE
                                    WHEN is_current THEN 1
                                END
                            ) as current_count,
                            max(blocknumber) as max_block
                        from
                            tracks
                        group by
                            track_id
                    ) current_tracks
                where
                    current_tracks.current_count < 1
            ) incorrect_tracks
        where
            incorrect_tracks.track_id = tracks.track_id
            and tracks.blocknumber = incorrect_tracks.max_block;
        """
    )


def downgrade():
    pass
