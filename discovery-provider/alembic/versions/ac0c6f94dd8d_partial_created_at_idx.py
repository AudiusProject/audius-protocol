"""partial_created_at_idx

Revision ID: ac0c6f94dd8d
Revises: df4709b4391b
Create Date: 2022-03-03 21:11:42.415590

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "ac0c6f94dd8d"
down_revision = "df4709b4391b"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    query = """
    BEGIN;

    -- make track_owner_id_idx a partial index
    DROP INDEX track_owner_id_idx;
    CREATE INDEX IF NOT EXISTS track_owner_id_idx ON tracks (owner_id) WHERE is_current and not is_delete;

    -- add index for track_created_at
    CREATE INDEX IF NOT EXISTS track_created_at_idx ON tracks (created_at) WHERE is_current and not is_delete;

    -- add index for playlist owner
    CREATE INDEX IF NOT EXISTS playlist_owner_id_idx ON playlists (playlist_owner_id) WHERE is_current and not is_delete;

    -- add index for playlist_created_at
    CREATE INDEX IF NOT EXISTS playlist_created_at_idx ON playlists (created_at) WHERE is_current and not is_delete;

    -- make repost_user_id a partial index
    DROP INDEX repost_user_id_idx;
    CREATE INDEX IF NOT EXISTS repost_user_id_idx ON reposts (user_id, repost_type) WHERE is_current and not is_delete;

    -- make repost_item_id a partial index
    DROP INDEX repost_item_id_idx;
    CREATE INDEX IF NOT EXISTS repost_item_id_idx ON reposts (repost_item_id, repost_type) WHERE is_current and not is_delete;

    -- add index for repost_created_at
    CREATE INDEX IF NOT EXISTS repost_created_at_idx ON reposts (created_at) WHERE is_current and not is_delete;

    -- make followee_user_id a partial index
    DROP INDEX ix_follows_followee_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_followee_user_id ON follows (followee_user_id) WHERE is_current and not is_delete;

    -- make follower_user_id a partial index
    DROP INDEX ix_follows_follower_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_follower_user_id ON follows (follower_user_id) WHERE is_current and not is_delete;

    -- saves
    DROP INDEX save_item_id_idx;
    CREATE INDEX IF NOT EXISTS save_item_id_idx ON saves (save_item_id, save_type) WHERE is_current and not is_delete;
    DROP INDEX save_user_id_idx;
    CREATE INDEX IF NOT EXISTS save_user_id_idx ON saves (user_id, save_type) WHERE is_current and not is_delete;

    COMMIT;
    """
    conn.execute(query)


def downgrade():
    conn = op.get_bind()
    query = """
    BEGIN;

    -- track owner + track created_at
    DROP INDEX track_owner_id_idx;
    CREATE INDEX IF NOT EXISTS track_owner_id_idx ON tracks (owner_id);
    DROP INDEX track_created_at_idx;

    -- playlist owner + playlist created_at
    DROP INDEX playlist_owner_id_idx;
    DROP INDEX playlist_created_at_idx;

    -- repost user
    DROP INDEX repost_user_id_idx;
    CREATE INDEX IF NOT EXISTS repost_user_id_idx ON reposts (user_id, repost_type);

    -- repost item id + repost created at
    DROP INDEX repost_item_id_idx;
    CREATE INDEX IF NOT EXISTS repost_item_id_idx ON reposts (repost_item_id, repost_type);
    DROP INDEX repost_created_at_idx;


    -- follows partial index
    DROP INDEX ix_follows_followee_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_followee_user_id ON follows (followee_user_id);

    DROP INDEX ix_follows_follower_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_follower_user_id ON follows (follower_user_id);

    -- saves
    DROP INDEX save_item_id_idx;
    CREATE INDEX IF NOT EXISTS save_item_id_idx ON saves (save_item_id, is_current, is_delete, save_type);
    DROP INDEX save_user_id_idx;
    CREATE INDEX IF NOT EXISTS save_user_id_idx ON saves (user_id, is_current, is_delete, save_type);

    COMMIT;
    """
    conn.execute(query)
