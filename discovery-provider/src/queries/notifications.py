import logging  # pylint: disable=C0302
from flask import Blueprint, request
from sqlalchemy import desc

from src import api_helpers
from src.queries import response_name_constants as const
from src.queries.query_helpers import get_repost_counts, get_save_counts, get_follower_count_dict
from src.models import Block, Follow, Save, SaveType, Playlist, Track, Repost, \
    RepostType, Remix, AggregateUser
from src.utils.db_session import get_db_read_replica
from src.utils.config import shared_config

logger = logging.getLogger(__name__)
bp = Blueprint("notifications", __name__)

max_block_diff = int(shared_config["discprov"]["notifications_max_block_diff"])


# pylint: disable=R0911
def get_owner_id(session, entity_type, entity_id):
    """
    Fetches the owner user id of the requested entity_type/entity_id

    Args:
        session: (obj) The start block number for querying for notifications
        entity_type: (string) Must be either 'track' | 'album' | 'playlist
        entity_id: (int) The id of the 'entity_type'

    Returns:
        owner_id: (int | None) The user id of the owner of the entity_type/entity_id
    """
    if entity_type == 'track':
        owner_id_query = session.query(Track.owner_id).filter(
            Track.track_id == entity_id,
            Track.is_delete == False,
            Track.is_current == True).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id

    if entity_type == 'album':
        owner_id_query = session.query(Playlist.playlist_owner_id).filter(
            Playlist.playlist_id == entity_id,
            Playlist.is_delete == False,
            Playlist.is_current == True,
            Playlist.is_album == True).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id

    if entity_type == 'playlist':
        owner_id_query = session.query(Playlist.playlist_owner_id).filter(
            Playlist.playlist_id == entity_id,
            Playlist.is_delete == False,
            Playlist.is_current == True,
            Playlist.is_album == False).all()
        if not owner_id_query:
            return None
        owner_id = owner_id_query[0][0]
        return owner_id

    return None


def get_cosign_remix_notifications(session, max_block_number, remix_tracks):
    """
    Get the notifications for remix tracks that are reposted/favorited by the parent remix author

    Args:
        session: (DB)
        max_block_number: (int)
        remix_tracks: (Array<{ }>)
            'user_id'
            'item_id'
            const.notification_blocknumber
            const.notification_timestamp
            'item_owner_id'

    Returns:
        Array of cosign notifications

    """
    if not remix_tracks:
        return []

    remix_notifications = []
    remix_track_ids = [r['item_id'] for r in remix_tracks]

    # Query for all the parent tracks of the remix tracks
    tracks_subquery = (
        session.query(Track)
        .filter(
            Track.is_unlisted == False,
            Track.is_delete == False,
            Track.is_current == True
        )
        .subquery()
    )

    parent_tracks = (
        session.query(
            Remix.child_track_id,
            Remix.parent_track_id,
            tracks_subquery.c.owner_id
        )
        .join(
            tracks_subquery,
            Remix.parent_track_id == tracks_subquery.c.track_id
        )
        .filter(
            Remix.child_track_id.in_(remix_track_ids)
        )
        .all()
    )
    # Mapping of parent track users to child track to parent track
    parent_track_users_to_remixes = {}
    for track_parent in parent_tracks:
        [remix_track_id, remix_parent_id, remix_parent_user_id] = track_parent
        if not remix_parent_user_id in parent_track_users_to_remixes:
            parent_track_users_to_remixes[remix_parent_user_id] = {
                remix_track_id: remix_parent_id
            }
        else:
            parent_track_users_to_remixes[remix_parent_user_id][remix_track_id] = remix_parent_id

    for remix_track in remix_tracks:
        user_id = remix_track['user_id']
        track_id = remix_track['item_id']

        if (user_id in parent_track_users_to_remixes and track_id in parent_track_users_to_remixes[user_id]):
            remix_notifications.append({
                const.notification_type: const.notification_type_remix_cosign,
                const.notification_blocknumber: remix_track[const.notification_blocknumber],
                const.notification_timestamp: remix_track[const.notification_timestamp],
                const.notification_initiator: user_id,
                const.notification_metadata: {
                    const.notification_entity_id: track_id,
                    const.notification_entity_type: 'track',
                    const.notification_entity_owner_id: remix_track['item_owner_id']
                }
            })

    return remix_notifications


@bp.route("/notifications", methods=("GET",))
# pylint: disable=R0915
def notifications():
    """
    Fetches the notifications events that occurred between the given block numbers

    URL Params:
        min_block_number: (int) The start block number for querying for notifications
        max_block_number?: (int) The end block number for querying for notifications
        track_id?: (Array<int>) Array of track id for fetching the track's owner id
            and adding the track id to owner user id mapping to the `owners` response field
            NOTE: this is added for notification for listen counts

    Response - Json object w/ the following fields
        notifications: Array of notifications of shape:
            type: 'Follow' | 'Favorite' | 'Repost' | 'Create' | 'RemixCreate' | 'RemixCosign'
            blocknumber: (int) blocknumber of notification
            timestamp: (string) timestamp of notification
            initiator: (int) the user id that caused this notification
            metadata?: (any) additional information about the notification
                entity_id?: (int) the id of the target entity (ie. playlist id of a playlist that is reposted)
                entity_type?: (string) the type of the target entity
                entity_owner_id?: (int) the id of the target entity's owner (if applicable)

        info: Dictionary of metadata w/ min_block_number & max_block_number fields

        milestones: Dictionary mapping of follows/reposts/favorites (processed within the blocks params)
            Root fields:
                follower_counts: Contains a dictionary of user id => follower count (up to the max_block_number)
                repost_counts: Contains a dictionary tracks/albums/playlists of id to repost count
                favorite_counts: Contains a dictionary tracks/albums/playlists of id to favorite count

        owners: Dictionary containing the mapping for track id / playlist id / album -> owner user id
            The root keys are 'tracks', 'playlists', 'albums' and each contains the id to owner id mapping
    """

    db = get_db_read_replica()
    min_block_number = request.args.get("min_block_number", type=int)
    max_block_number = request.args.get("max_block_number", type=int)

    track_ids_to_owner = []
    try:
        track_ids_str_list = request.args.getlist("track_id")
        track_ids_to_owner = [int(y) for y in track_ids_str_list]
    except Exception as e:
        logger.error(f'Failed to retrieve track list {e}')

    # Max block number is not explicitly required (yet)
    if not min_block_number and min_block_number != 0:
        return api_helpers.error_response({'msg': 'Missing min block number'}, 500)

    if not max_block_number:
        max_block_number = min_block_number + max_block_diff
    elif (max_block_number - min_block_number) > max_block_diff:
        max_block_number = (min_block_number + max_block_diff)

    with db.scoped_session() as session:
        current_block_query = session.query(Block).filter_by(is_current=True)
        current_block_query_results = current_block_query.all()
        current_block = current_block_query_results[0]
        current_max_block_num = current_block.number
        if current_max_block_num < max_block_number:
            max_block_number = current_max_block_num

    notification_metadata = {
        'min_block_number': min_block_number,
        'max_block_number': max_block_number
    }

    # Retrieve milestones statistics
    milestone_info = {}

    # Cache owner info for network entities and pass in w/results
    owner_info = {
        const.tracks: {},
        const.albums: {},
        const.playlists: {}
    }

    # List of notifications generated from current protocol state
    notifications_unsorted = []
    with db.scoped_session() as session:
        # Query relevant follow information
        follow_query = session.query(Follow)

        # Impose min block number restriction
        follow_query = follow_query.filter(
            Follow.is_current == True,
            Follow.is_delete == False,
            Follow.blocknumber > min_block_number,
            Follow.blocknumber <= max_block_number)

        follow_results = follow_query.all()
        # Used to retrieve follower counts for this window
        followed_users = []
        # Represents all follow notifications
        follow_notifications = []
        for entry in follow_results:
            follow_notif = {
                const.notification_type:
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
            # Add every user who gained a new follower
            followed_users.append(entry.followee_user_id)

        # Query count for any user w/new followers
        follower_counts = get_follower_count_dict(
            session, followed_users, max_block_number)
        milestone_info['follower_counts'] = follower_counts

        notifications_unsorted.extend(follow_notifications)

        # Query relevant favorite information
        favorites_query = session.query(Save)
        favorites_query = favorites_query.filter(
            Save.is_current == True,
            Save.is_delete == False,
            Save.blocknumber > min_block_number,
            Save.blocknumber <= max_block_number)
        favorite_results = favorites_query.all()

        # ID lists to query count aggregates
        favorited_track_ids = []
        favorited_album_ids = []
        favorited_playlist_ids = []

        # List of favorite notifications
        favorite_notifications = []
        favorite_remix_tracks = []

        for entry in favorite_results:
            favorite_notif = {
                const.notification_type:
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
                favorited_track_ids.append(save_item_id)
                owner_info[const.tracks][save_item_id] = owner_id

                favorite_remix_tracks.append({
                    const.notification_blocknumber: entry.blocknumber,
                    const.notification_timestamp: entry.created_at,
                    'user_id': entry.user_id,
                    'item_owner_id': owner_id,
                    'item_id': save_item_id
                })

            elif save_type == SaveType.album:
                owner_id = get_owner_id(session, 'album', save_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
                favorited_album_ids.append(save_item_id)
                owner_info[const.albums][save_item_id] = owner_id

            elif save_type == SaveType.playlist:
                owner_id = get_owner_id(session, 'playlist', save_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
                favorited_playlist_ids.append(save_item_id)
                owner_info[const.playlists][save_item_id] = owner_id

            favorite_notif[const.notification_metadata] = metadata
            favorite_notifications.append(favorite_notif)
        notifications_unsorted.extend(favorite_notifications)

        track_favorite_dict = {}
        album_favorite_dict = {}
        playlist_favorite_dict = {}

        if favorited_track_ids:
            track_favorite_counts = \
                get_save_counts(session, False, False, favorited_track_ids, [
                    SaveType.track], max_block_number)
            track_favorite_dict = \
                {track_id: fave_count for (
                    track_id, fave_count) in track_favorite_counts}

            favorite_remix_notifications = get_cosign_remix_notifications(
                session, max_block_number, favorite_remix_tracks)
            notifications_unsorted.extend(favorite_remix_notifications)

        if favorited_album_ids:
            album_favorite_counts = \
                get_save_counts(session, False, False, favorited_album_ids, [
                    SaveType.album], max_block_number)
            album_favorite_dict = \
                {album_id: fave_count for (
                    album_id, fave_count) in album_favorite_counts}

        if favorited_playlist_ids:
            playlist_favorite_counts = \
                get_save_counts(session, False, False, favorited_playlist_ids, [
                    SaveType.playlist], max_block_number)
            playlist_favorite_dict = \
                {playlist_id: fave_count for (
                    playlist_id, fave_count) in playlist_favorite_counts}

        milestone_info[const.notification_favorite_counts] = {}
        milestone_info[const.notification_favorite_counts][const.tracks] = track_favorite_dict
        milestone_info[const.notification_favorite_counts][const.albums] = album_favorite_dict
        milestone_info[const.notification_favorite_counts][const.playlists] = playlist_favorite_dict

        #
        # Query relevant repost information
        #
        repost_query = session.query(Repost)
        repost_query = repost_query.filter(
            Repost.is_current == True,
            Repost.is_delete == False,
            Repost.blocknumber > min_block_number,
            Repost.blocknumber <= max_block_number)
        repost_results = repost_query.all()

        # ID lists to query counts
        reposted_track_ids = []
        reposted_album_ids = []
        reposted_playlist_ids = []

        # List of repost notifications
        repost_notifications = []

        # List of repost notifications
        repost_remix_notifications = []
        repost_remix_tracks = []

        for entry in repost_results:
            repost_notif = {
                const.notification_type:
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
                reposted_track_ids.append(repost_item_id)
                owner_info[const.tracks][repost_item_id] = owner_id
                repost_remix_tracks.append({
                    const.notification_blocknumber: entry.blocknumber,
                    const.notification_timestamp: entry.created_at,
                    'user_id': entry.user_id,
                    'item_owner_id': owner_id,
                    'item_id': repost_item_id
                })

            elif repost_type == RepostType.album:
                owner_id = get_owner_id(session, 'album', repost_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
                reposted_album_ids.append(repost_item_id)
                owner_info[const.albums][repost_item_id] = owner_id

            elif repost_type == RepostType.playlist:
                owner_id = get_owner_id(session, 'playlist', repost_item_id)
                if not owner_id:
                    continue
                metadata[const.notification_entity_owner_id] = owner_id
                reposted_playlist_ids.append(repost_item_id)
                owner_info[const.playlists][repost_item_id] = owner_id

            repost_notif[const.notification_metadata] = metadata
            repost_notifications.append(repost_notif)

        # Append repost notifications
        notifications_unsorted.extend(repost_notifications)

        track_repost_count_dict = {}
        album_repost_count_dict = {}
        playlist_repost_count_dict = {}

        # Aggregate repost counts for relevant fields
        # Used to notify users of entity-specific milestones
        if reposted_track_ids:
            track_repost_counts = \
                get_repost_counts(
                    session,
                    False,
                    False,
                    reposted_track_ids,
                    [RepostType.track],
                    max_block_number)
            track_repost_count_dict = \
                {track_id: repost_count
                 for (track_id, repost_count) in track_repost_counts}

            repost_remix_notifications = get_cosign_remix_notifications(
                session, max_block_number, repost_remix_tracks)
            notifications_unsorted.extend(repost_remix_notifications)

        if reposted_album_ids:
            album_repost_counts = \
                get_repost_counts(
                    session,
                    False,
                    False,
                    reposted_album_ids,
                    [RepostType.album],
                    max_block_number)
            album_repost_count_dict = \
                {album_id: repost_count
                 for (album_id, repost_count) in album_repost_counts}

        if reposted_playlist_ids:
            playlist_repost_counts = \
                get_repost_counts(
                    session,
                    False,
                    False,
                    reposted_playlist_ids,
                    [RepostType.playlist],
                    max_block_number)
            playlist_repost_count_dict = \
                {playlist_id: repost_count
                 for (playlist_id, repost_count) in playlist_repost_counts}

        milestone_info[const.notification_repost_counts] = {}
        milestone_info[const.notification_repost_counts][const.tracks] = track_repost_count_dict
        milestone_info[const.notification_repost_counts][const.albums] = album_repost_count_dict
        milestone_info[const.notification_repost_counts][const.playlists] = playlist_repost_count_dict

        # Query relevant created entity notification - tracks/albums/playlists
        created_notifications = []

        # Query relevant created tracks for remix information
        remix_created_notifications = []

        # Aggregate track notifs
        tracks_query = session.query(Track)
        # TODO: Is it valid to use Track.is_current here? Might not be the right info...
        tracks_query = tracks_query.filter(
            Track.is_unlisted == False,
            Track.is_delete == False,
            Track.stem_of == None,
            Track.blocknumber > min_block_number,
            Track.blocknumber <= max_block_number)
        tracks_query = tracks_query.filter(
            Track.created_at == Track.updated_at)
        track_results = tracks_query.all()
        for entry in track_results:
            track_notif = {
                const.notification_type:
                const.notification_type_create,
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

            if entry.remix_of:
                # Add notification to remix track owner
                parent_remix_tracks = [t['parent_track_id']
                                       for t in entry.remix_of['tracks']]
                remix_track_parents = (
                    session.query(Track.owner_id, Track.track_id)
                    .filter(
                        Track.track_id.in_(parent_remix_tracks),
                        Track.is_unlisted == False,
                        Track.is_delete == False,
                        Track.is_current == True
                    )
                    .all()
                )
                for remix_track_parent in remix_track_parents:
                    [remix_track_parent_owner,
                     remix_track_parent_id] = remix_track_parent
                    remix_notif = {
                        const.notification_type: const.notification_type_remix_create,
                        const.notification_blocknumber: entry.blocknumber,
                        const.notification_timestamp: entry.created_at,
                        const.notification_initiator: entry.owner_id,
                        # TODO: is entity owner id necessary for tracks?
                        const.notification_metadata: {
                            const.notification_entity_type: 'track',
                            const.notification_entity_id: entry.track_id,
                            const.notification_entity_owner_id: entry.owner_id,
                            const.notification_remix_parent_track_user_id: remix_track_parent_owner,
                            const.notification_remix_parent_track_id: remix_track_parent_id
                        }
                    }
                    remix_created_notifications.append(remix_notif)

        # Handle track update notifications
        # TODO: Consider switching blocknumber for updated at?
        updated_tracks_query = session.query(Track)
        updated_tracks_query = updated_tracks_query.filter(
            Track.is_unlisted == False,
            Track.stem_of == None,
            Track.created_at != Track.updated_at,
            Track.blocknumber > min_block_number,
            Track.blocknumber <= max_block_number)
        updated_tracks = updated_tracks_query.all()
        for entry in updated_tracks:
            prev_entry_query = (
                session.query(Track)
                .filter(
                    Track.track_id == entry.track_id,
                    Track.blocknumber < entry.blocknumber)
                .order_by(desc(Track.blocknumber))
            )
            # Previous unlisted entry indicates transition to public, triggering a notification
            prev_entry = prev_entry_query.first()

            # Tracks that were unlisted and turned to public
            if prev_entry.is_unlisted == True:
                track_notif = {
                    const.notification_type:
                    const.notification_type_create,
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

            # Tracks that were not remixes and turned into remixes
            if not prev_entry.remix_of and entry.remix_of:
                # Add notification to remix track owner
                parent_remix_tracks = [t['parent_track_id']
                                       for t in entry.remix_of['tracks']]
                remix_track_parents = (
                    session.query(Track.owner_id, Track.track_id)
                    .filter(
                        Track.track_id.in_(parent_remix_tracks),
                        Track.is_unlisted == False,
                        Track.is_delete == False,
                        Track.is_current == True
                    )
                    .all()
                )
                for remix_track_parent in remix_track_parents:
                    [remix_track_parent_owner,
                     remix_track_parent_id] = remix_track_parent
                    remix_notif = {
                        const.notification_type: const.notification_type_remix_create,
                        const.notification_blocknumber: entry.blocknumber,
                        const.notification_timestamp: entry.created_at,
                        const.notification_initiator: entry.owner_id,
                        # TODO: is entity owner id necessary for tracks?
                        const.notification_metadata: {
                            const.notification_entity_type: 'track',
                            const.notification_entity_id: entry.track_id,
                            const.notification_entity_owner_id: entry.owner_id,
                            const.notification_remix_parent_track_user_id: remix_track_parent_owner,
                            const.notification_remix_parent_track_id: remix_track_parent_id
                        }
                    }
                    remix_created_notifications.append(remix_notif)

        notifications_unsorted.extend(remix_created_notifications)

        # Aggregate playlist/album notifs
        collection_query = session.query(Playlist)
        # TODO: Is it valid to use is_current here? Might not be the right info...
        collection_query = collection_query.filter(
            Playlist.is_delete == False,
            Playlist.is_private == False,
            Playlist.blocknumber > min_block_number,
            Playlist.blocknumber <= max_block_number)
        collection_query = collection_query.filter(
            Playlist.created_at == Playlist.updated_at)
        collection_results = collection_query.all()

        for entry in collection_results:
            collection_notif = {
                const.notification_type:
                const.notification_type_create,
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
                metadata[const.notification_entity_type] = 'album'
            else:
                metadata[const.notification_entity_type] = 'playlist'
            collection_notif[const.notification_metadata] = metadata
            created_notifications.append(collection_notif)

        # Playlists that were private and turned to public aka 'published'
        # TODO: Consider switching blocknumber for updated at?
        publish_playlists_query = session.query(Playlist)
        publish_playlists_query = publish_playlists_query.filter(
            Playlist.is_private == False,
            Playlist.created_at != Playlist.updated_at,
            Playlist.blocknumber > min_block_number,
            Playlist.blocknumber <= max_block_number)
        publish_playlist_results = publish_playlists_query.all()
        for entry in publish_playlist_results:
            prev_entry_query = (
                session.query(Playlist)
                .filter(
                    Playlist.playlist_id == entry.playlist_id,
                    Playlist.blocknumber < entry.blocknumber)
                .order_by(desc(Playlist.blocknumber))
            )
            # Previous private entry indicates transition to public, triggering a notification
            prev_entry = prev_entry_query.first()
            if prev_entry.is_private == True:
                publish_playlist_notif = {
                    const.notification_type:
                    const.notification_type_create,
                    const.notification_blocknumber: entry.blocknumber,
                    const.notification_timestamp: entry.created_at,
                    const.notification_initiator: entry.playlist_owner_id
                }
                metadata = {
                    const.notification_entity_id: entry.playlist_id,
                    const.notification_entity_owner_id: entry.playlist_owner_id,
                    const.notification_collection_content: entry.playlist_contents,
                    const.notification_entity_type: 'playlist'
                }
                publish_playlist_notif[const.notification_metadata] = metadata
                created_notifications.append(publish_playlist_notif)

        notifications_unsorted.extend(created_notifications)

        # Get additional owner info as requested for listen counts
        tracks_owner_query = (
            session.query(Track)
            .filter(
                Track.is_current == True,
                Track.track_id.in_(track_ids_to_owner))
        )
        track_owner_results = tracks_owner_query.all()
        for entry in track_owner_results:
            owner = entry.owner_id
            track_id = entry.track_id
            owner_info[const.tracks][track_id] = owner

    # Final sort - TODO: can we sort by timestamp?
    sorted_notifications = \
        sorted(notifications_unsorted,
               key=lambda i: i[const.notification_blocknumber], reverse=False)

    return api_helpers.success_response(
        {
            'notifications': sorted_notifications,
            'info': notification_metadata,
            'milestones': milestone_info,
            'owners': owner_info
        }
    )


@bp.route("/milestones/followers", methods=("GET",))
def milestones_followers():
    db = get_db_read_replica()
    if "user_id" not in request.args:
        return api_helpers.error_response({'msg': 'Please provider user ids'}, 500)

    try:
        user_id_str_list = request.args.getlist("user_id")
        user_ids = []
        user_ids = [int(y) for y in user_id_str_list]
    except ValueError as e:
        logger.error("Invalid value found in user id list", esc_info=True)
        return api_helpers.error_response({'msg': e}, 500)

    with db.scoped_session() as session:
        follower_counts = (
            session.query(
                AggregateUser.user_id,
                AggregateUser.follower_count
            )
            .filter(
                AggregateUser.user_id.in_(user_ids)
            )
            .all()
        )
        follower_count_dict = \
            {user_id: follower_count for (
                user_id, follower_count) in follower_counts}

    return api_helpers.success_response(follower_count_dict)
