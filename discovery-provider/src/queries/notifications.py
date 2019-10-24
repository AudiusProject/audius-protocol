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

    # TODO: Revise below as it is not entirely correct...
    # if not max_block_number:
    #    max_block_number = min_block_number + 10000

    notifications = []
    with db.scoped_session() as session:
        #
        # Query relevant follow information
        #
        follow_query = session.query(Follow)

        # Impose min block number restriction
        follow_query = follow_query.filter(Follow.is_current == True, Follow.is_delete == False)
        follow_query = follow_query.filter(Follow.blocknumber >= min_block_number)

        # follow_query = follow_query.filter(Follow.blocknumber < max_block_number)

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
        favorites_query = favorites_query.filter(Save.blocknumber >= min_block_number)
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
        repost_query = repost_query.filter(Repost.blocknumber >= min_block_number)
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

    # Final sort - TODO: can we sort by timestamp?
    sorted_notifications = \
            sorted(notifications, key=lambda i: i[const.notification_blocknumber], reverse=True)

    return api_helpers.success_response({'tmp':sorted_notifications})
