import logging # pylint: disable=C0302
from flask import Blueprint, request
from src import api_helpers
from src.queries import response_name_constants as const
from src.models import Follow, Save, SaveType, Playlist, Track, Repost, RepostType
from src.utils.db_session import get_db

logger = logging.getLogger(__name__)
bp = Blueprint("notifications", __name__)

notif_types = {
    'follow': 'follow'
}

max_block_diff = 50000

def get_owner_id(session, entity_type, entity_id):
    if entity_type == 'track':
        owner_id_query = session.query(Track.owner_id).filter(
            Track.track_id == entity_id,
            Track.is_delete == False,
            Track.is_current == True).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id
    elif entity_type == 'album':
        owner_id_query = session.query(Playlist.playlist_owner_id).filter(
            Playlist.playlist_id == entity_id,
            Playlist.is_delete == False,
            Playlist.is_current == True,
            Playlist.is_album == True).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id
    elif entity_type == 'playlist':
        owner_id_query = session.query(Playlist.playlist_owner_id).filter(
            Playlist.playlist_id == entity_id,
            Playlist.is_delete == False,
            Playlist.is_current == True,
            Playlist.is_album == False).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id
    else:
        return None

@bp.route("/notifications", methods=("GET",))
def notifications():
    db = get_db()
    min_block_number = request.args.get("min_block_number", type=int)
    max_block_number = request.args.get("max_block_number", type=int)

    # Max block number is not explicitly required (yet)
    if not min_block_number:
        return api_helpers.error_response({'msg': 'Missing min block number'}, 500)

    if not max_block_number:
        max_block_number = min_block_number + max_block_diff
    elif (max_block_number - min_block_number) > (min_block_number + max_block_diff):
        max_block_number = (min_block_number + max_block_diff)

    notification_metadata = {
        'min_block_number': min_block_number,
        'max_block_number': max_block_number
    }
    notifications = []
    with db.scoped_session() as session:
        #
        # Query relevant follow information
        #
        follow_query = session.query(Follow)

        # Impose min block number restriction
        follow_query = follow_query.filter(Follow.is_current == True, Follow.is_delete == False)
        follow_query = follow_query.filter(Follow.blocknumber >= min_block_number, Follow.blocknumber < max_block_number)

        follow_results = follow_query.all()
        follow_notifications = []
        for entry in follow_results:
            follow_notif = {
                const.notification_type: \
                        const.notification_type_follow,
                const.notification_blocknumber: entry.blocknumber,
                const.notification_timestamp: entry.created_at,
                const.notification_initiator: entry.follower_user_id,
                const.notification_metadata: {
                    const.notification_follower_id: entry.follower_user_id,
                    const.notification_followee_id: entry.followee_user_id
                }
            }
            follow_notifications.append(follow_notif)
        notifications.extend(follow_notifications)

        #
        # Query relevant favorite information
        #
        favorites_query = session.query(Save)
        favorites_query = favorites_query.filter(Save.is_current == True, Save.is_delete == False)
        favorites_query = favorites_query.filter(Save.blocknumber >= min_block_number, Save.blocknumber < max_block_number)
        favorite_results = favorites_query.all()
        favorite_notifications = []

        for entry in favorite_results:
            # logger.error(entry)
            favorite_notif = {
                const.notification_type: \
                        const.notification_type_favorite,
                const.notification_blocknumber: entry.blocknumber,
                const.notification_timestamp: entry.created_at,
                const.notification_initiator: entry.user_id
            }
            save_type = entry.save_type
            save_item_id = entry.save_item_id
            metadata = {
                const.notification_entity_type: save_type,
                const.notification_entity_id: save_item_id
            }

            # NOTE if deleted, the favorite can still exist
            # TODO: Can we aggregate all owner queries and perform at once...?
            if save_type == SaveType.track:
                owner_id = get_owner_id(session, 'track', save_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
            elif save_type == SaveType.album:
                owner_id = get_owner_id(session, 'album', save_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id

            elif save_type == SaveType.playlist:
                owner_id = get_owner_id(session, 'album', save_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id

            favorite_notif[const.notification_metadata] = metadata

            favorite_notifications.append(favorite_notif)
        notifications.extend(favorite_notifications)

        #
        # Query relevant repost information
        #
        repost_query = session.query(Repost)
        repost_query = repost_query.filter(Repost.is_current == True, Repost.is_delete == False)
        repost_query = repost_query.filter(Repost.blocknumber >= min_block_number, Repost.blocknumber < max_block_number)
        repost_results = repost_query.all()
        repost_notifications = []
        for entry in repost_results:
            repost_notif = {
                const.notification_type: \
                        const.notification_type_repost,
                const.notification_blocknumber: entry.blocknumber,
                const.notification_timestamp: entry.created_at,
                const.notification_initiator: entry.user_id
            }
            repost_type = entry.repost_type
            repost_item_id = entry.repost_item_id
            metadata = {
                const.notification_entity_type: repost_type,
                const.notification_entity_id: repost_item_id
            }
            if repost_type == RepostType.track:
                owner_id = get_owner_id(session, 'track', repost_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
            elif repost_type == RepostType.album:
                owner_id = get_owner_id(session, 'album', repost_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
            elif repost_type == RepostType.playlist:
                owner_id = get_owner_id(session, 'playlist', repost_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
            repost_notif[const.notification_metadata] = metadata
            repost_notifications.append(repost_notif)
        notifications.extend(repost_notifications)

        # Query relevant created entity notification - tracks/albums/playlists
        created_notifications = []
        # Aggregate track notifs
        tracks_query = session.query(Track)
        # TODO: Is it valid to use Track.is_current here? Might not be the right info...
        tracks_query = tracks_query.filter(Track.is_delete == False)
        tracks_query = tracks_query.filter(Track.blocknumber >= min_block_number, Track.blocknumber < max_block_number)
        tracks_query = tracks_query.filter(Track.created_at == Track.updated_at)
        track_results = tracks_query.all()
        for entry in track_results:
            track_notif = {
                const.notification_type: \
                        const.notification_type_created_track,
                const.notification_blocknumber: entry.blocknumber,
                const.notification_timestamp: entry.created_at,
                const.notification_initiator: entry.owner_id,
                # TODO: is entity owner id necessary for tracks?
                const.notification_metadata: {
                    const.notification_entity_type: 'track',
                    const.notification_entity_id: entry.track_id,
                    const.notification_entity_owner_id: entry.owner_id
                }
            }
            created_notifications.append(track_notif)

        # Aggregate playlist/album notifs
        collection_query = session.query(Playlist)
        # TODO: Is it valid to use is_current here? Might not be the right info...
        collection_query = collection_query.filter(Playlist.is_delete == False, Playlist.is_private == False)
        collection_query = collection_query.filter(Playlist.blocknumber >= min_block_number, Playlist.blocknumber < max_block_number)
        collection_query = collection_query.filter(Playlist.created_at == Playlist.updated_at)
        collection_results = collection_query.all()
        for entry in collection_results:
            collection_notif = {
                const.notification_blocknumber: entry.blocknumber,
                const.notification_timestamp: entry.created_at,
                const.notification_initiator: entry.playlist_owner_id
            }
            metadata = {
                const.notification_entity_id: entry.playlist_id,
                const.notification_entity_owner_id: entry.playlist_owner_id,
                const.notification_collection_content: entry.playlist_contents
            }

            if entry.is_album:
                collection_notif[const.notification_type] = const.notification_type_created_album
                metadata[const.notification_entity_type] = 'album'
            else:
                collection_notif[const.notification_type] = const.notification_type_created_playlist
                metadata[const.notification_entity_type] = 'playlist'
            collection_notif[const.notification_metadata] = metadata
            created_notifications.append(collection_notif)
        notifications.extend(created_notifications)

    # Final sort - TODO: can we sort by timestamp?
    # TODO: should this be reverse or not? reverse=True - time desc., else time asc.
    sorted_notifications = \
            sorted(notifications, key=lambda i: i[const.notification_blocknumber], reverse=True)

    return api_helpers.success_response({'notifications':sorted_notifications, 'info':notification_metadata})
