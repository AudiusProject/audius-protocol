"""index repair

Revision ID: 88daa6a4f269
Revises: 5e17e0480ca7
Create Date: 2022-06-06 17:12:40.386722

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "88daa6a4f269"
down_revision = "5e17e0480ca7"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    conn.execute(
        """
    BEGIN;

    -- drop any ad-hoc indexes added in different environments
    drop index if exists fix_repost_item_id_idx;
    drop index if exists fix_repost_user_id_idx;
    drop index if exists fix_save_item_id_idx;
    drop index if exists fix_follows_followee_user_id;
    drop index if exists fix_follows_follower_user_id;
    drop index if exists fix_track_owner_id_idx;
    drop index if exists fix_playlist_owner_id_idx;
    drop index if exists fix_save_user_id_idx;
    drop index if exists follows_inbound_idx;
    drop index if exists follows_outbound_idx;
    drop index if exists save_item_id_idx_all;
    drop index if exists repost_item_id_idx_all;


    -- undo partial indexes

    DROP INDEX IF EXISTS track_owner_id_idx;
    CREATE INDEX IF NOT EXISTS track_owner_id_idx ON tracks (owner_id);


    drop index if exists track_created_at_idx;
    CREATE INDEX IF NOT EXISTS track_created_at_idx ON tracks (created_at);


    drop index if exists playlist_owner_id_idx;
    CREATE INDEX IF NOT EXISTS playlist_owner_id_idx ON playlists (playlist_owner_id);


    drop index if exists playlist_created_at_idx;
    CREATE INDEX IF NOT EXISTS playlist_created_at_idx ON playlists (created_at);


    DROP INDEX IF EXISTS repost_user_id_idx;
    CREATE INDEX IF NOT EXISTS repost_user_id_idx ON reposts (user_id, repost_type);


    DROP INDEX IF EXISTS repost_item_id_idx;
    CREATE INDEX IF NOT EXISTS repost_item_id_idx ON reposts (repost_item_id, repost_type);


    drop index if exists repost_created_at_idx;
    CREATE INDEX IF NOT EXISTS repost_created_at_idx ON reposts (created_at);


    DROP INDEX IF EXISTS ix_follows_followee_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_followee_user_id ON follows (followee_user_id);


    DROP INDEX IF EXISTS ix_follows_follower_user_id;
    CREATE INDEX IF NOT EXISTS ix_follows_follower_user_id ON follows (follower_user_id);


    DROP INDEX IF EXISTS save_item_id_idx;
    CREATE INDEX IF NOT EXISTS save_item_id_idx ON saves (save_item_id, save_type);
    DROP INDEX IF EXISTS save_user_id_idx;
    CREATE INDEX IF NOT EXISTS save_user_id_idx ON saves (user_id, save_type);

    

    -- add some new indexes that can help with expensive queries
    create index follows_inbound_idx on follows (followee_user_id, follower_user_id, is_current, is_delete);
    
    create index if not exists follows_blocknumber_idx on follows(blocknumber);
    create index if not exists saves_blocknumber_idx on saves(blocknumber);
    create index if not exists reposts_blocknumber_idx on reposts(blocknumber);
    create index if not exists tracks_blocknumber_idx on tracks(blocknumber);
    create index if not exists users_blocknumber_idx on users(blocknumber);
    create index if not exists playlists_blocknumber_idx on playlists(blocknumber);

    COMMIT;
    """
    )


def downgrade():
    # not going to put a downgrade here, as the above is essentially the manually created "downgrade" of:
    # https://github.com/AudiusProject/audius-protocol/blob/master/discovery-provider/alembic/versions/d321f0a00721_partial_indexes.py
    #
    # if we need to further adjust these indexes we can do it in a later "roll forward" migration
    pass
