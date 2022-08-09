"""migrate miletones to notifications

Revision ID: 9931f7fd118f
Revises: 58b26285cdcf
Create Date: 2022-07-14 17:59:04.556315

"""
import sqlalchemy
from alembic import op

# revision identifiers, used by Alembic.
revision = "9931f7fd118f"
down_revision = "58b26285cdcf"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    connection.execute(
        sqlalchemy.text(
            """
        SELECT pg_cancel_backend(pid)
        FROM pg_stat_activity 
        WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%' and pid <> pg_backend_pid() 
        ORDER BY query_start DESC;
        
        begin;
            insert into notification
                (user_ids, specifier, group_id, type, blocknumber, timestamp, data)
                    select
                            array[tracks.owner_id],
                            tracks.owner_id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.blocknumber,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "track_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    left join tracks on tracks.track_id = milestones.id
                    where tracks.is_current AND milestones.blocknumber !=0 and milestones.name='TRACK_REPOST_COUNT';
    

            insert into notification
                (user_ids, specifier, group_id, type, blocknumber, timestamp, data)
                    select
                            array[playlists.playlist_owner_id],
                            playlists.playlist_owner_id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.blocknumber,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "playlist_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    left join playlists on playlists.playlist_id = milestones.id
                    where playlists.is_current AND milestones.blocknumber !=0 and milestones.name='PLAYLIST_REPOST_COUNT';

            insert into notification
                (user_ids, specifier, group_id, type, blocknumber, timestamp, data)
                    select
                            array[tracks.owner_id],
                            tracks.owner_id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.blocknumber,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "track_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    left join tracks on tracks.track_id = milestones.id
                    where tracks.is_current AND milestones.blocknumber !=0 and milestones.name='TRACK_SAVE_COUNT';
    
            insert into notification
                (user_ids, specifier, group_id, type, blocknumber, timestamp, data)
                    select
                            array[playlists.playlist_owner_id],
                            playlists.playlist_owner_id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.blocknumber,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "playlist_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    left join playlists on playlists.playlist_id = milestones.id
                    where playlists.is_current AND milestones.blocknumber !=0 and milestones.name='PLAYLIST_SAVE_COUNT';

            insert into notification
                (user_ids, specifier, group_id, type, blocknumber, timestamp, data)
                    select
                            array[milestones.id],
                            milestones.id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.blocknumber,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "user_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    where milestones.name='FOLLOWER_COUNT' AND milestones.blocknumber !=0;

            insert into notification
                (user_ids, specifier, group_id, type, slot, timestamp, data)
                    select
                            array[tracks.owner_id],
                            tracks.owner_id,
                            'milestone:' || milestones.name  || ':id:' || milestones.id || ':threshold:' || milestones.threshold,
                            'milestone',
                            milestones.slot,
                            milestones.timestamp,
                            ('{"type":"'|| milestones.name || '", "track_id":' || milestones.id || ', "threshold":' || milestones.threshold || '}')::json
                    from milestones
                    left join tracks on tracks.track_id = milestones.id
                    where tracks.is_current AND milestones.slot !=0 and milestones.name='LISTEN_COUNT';

        commit;
        
    """
        )
    )


def downgrade():
    connection = op.get_bind()
    connection.execute(
        sqlalchemy.text(
            """
        delete from notification 
        where type in (
            'milestone',
        );
        """
        )
    )
