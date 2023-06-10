import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, Set

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.tasks.entity_manager.utils import (
    PLAYLIST_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.tasks.task_helpers import generate_slug_and_collision_id
from src.utils import helpers

logger = logging.getLogger(__name__)


def update_playlist_routes_table(session, playlist_record, pending_playlist_routes):
    logger.info(
        f"index.py | playlists.py | Updating playlist routes for {playlist_record.playlist_id}"
    )
    # Get the title slug, and set the new slug to that
    # (will check for conflicts later)
    new_playlist_slug_title = helpers.sanitize_slug(
        playlist_record.playlist_name, playlist_record.playlist_id
    )
    new_playlist_slug = new_playlist_slug_title

    # Find the current route for the playlist
    # Check the pending playlist route updates first
    prev_playlist_route_record = next(
        (
            route
            for route in pending_playlist_routes
            if route.is_current and route.playlist_id == playlist_record.playlist_id
        ),
        None,
    )

    # Then query the DB if necessary
    if prev_playlist_route_record is None:
        prev_playlist_route_record = (
            session.query(PlaylistRoute)
            .filter(
                PlaylistRoute.playlist_id == playlist_record.playlist_id,
                PlaylistRoute.is_current == True,
            )  # noqa: E712
            .one_or_none()
        )

    if prev_playlist_route_record:
        if prev_playlist_route_record.title_slug == new_playlist_slug_title:
            # If the title slug hasn't changed, we have no work to do
            logger.info(f"not changing for {playlist_record.playlist_id}")
            return
        # The new route will be current
        prev_playlist_route_record.is_current = False

    new_playlist_slug, new_collision_id = generate_slug_and_collision_id(
        session,
        PlaylistRoute,
        playlist_record.playlist_id,
        playlist_record.playlist_name,
        playlist_record.playlist_owner_id,
        pending_playlist_routes,
        new_playlist_slug_title,
        new_playlist_slug,
    )

    # Add the new playlist route
    new_playlist_route = PlaylistRoute()
    new_playlist_route.slug = new_playlist_slug
    new_playlist_route.title_slug = new_playlist_slug_title
    new_playlist_route.collision_id = new_collision_id
    new_playlist_route.owner_id = playlist_record.playlist_owner_id
    new_playlist_route.playlist_id = playlist_record.playlist_id
    new_playlist_route.is_current = True
    new_playlist_route.blockhash = playlist_record.blockhash
    new_playlist_route.blocknumber = playlist_record.blocknumber
    new_playlist_route.txhash = playlist_record.txhash
    session.add(new_playlist_route)

    # Add to pending playlist routes so we don't add the same route twice
    pending_playlist_routes.append(new_playlist_route)

    logger.info(
        f"index.py | playlists.py | Updated playlist routes for {playlist_record.playlist_id} with slug {new_playlist_slug} and owner_id {new_playlist_route.owner_id}"
    )


def get_playlist_events_tx(update_task, event_type, tx_receipt):
    return getattr(update_task.playlist_contract.events, event_type)().processReceipt(
        tx_receipt
    )


def validate_playlist_tx(params: ManageEntityParameters):
    user_id = params.user_id
    playlist_id = params.entity_id
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(f"User {user_id} does not exist")

    wallet = params.existing_records[EntityType.USER][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception(f"User {user_id} does not match signer")

    if params.entity_type != EntityType.PLAYLIST:
        raise Exception(f"Entity type {params.entity_type} is not a playlist")

    premium_tracks = list(
        filter(
            lambda track: track.is_premium,
            params.existing_records[EntityType.TRACK].values(),
        )
    )
    if premium_tracks:
        raise Exception("Cannot add premium tracks to playlist")

    if params.action == Action.CREATE:
        if playlist_id in params.existing_records[EntityType.PLAYLIST]:
            raise Exception(f"Cannot create playlist {playlist_id} that already exists")
        if playlist_id < PLAYLIST_ID_OFFSET:
            raise Exception(f"Cannot create playlist {playlist_id} below the offset")
    else:
        if playlist_id not in params.existing_records[EntityType.PLAYLIST]:
            raise Exception(f"Cannot update playlist {playlist_id} that does not exist")
        existing_playlist: Playlist = params.existing_records[EntityType.PLAYLIST][
            playlist_id
        ]
        if existing_playlist.playlist_owner_id != user_id:
            raise Exception(
                f"Cannot update playlist {playlist_id} that does not belong to user {user_id}"
            )


def create_playlist(params: ManageEntityParameters):
    validate_playlist_tx(params)

    playlist_id = params.entity_id
    metadata = params.metadata[params.metadata_cid]
    tracks = metadata["playlist_contents"].get("track_ids", [])
    tracks_with_index_time = []
    last_added_to = None
    for track in tracks:
        tracks_with_index_time.append(
            {
                "track": track["track"],
                "metadata_time": track["time"],
                "time": params.block_integer_time,
            }
        )
        last_added_to = params.block_datetime
    create_playlist_record = Playlist(
        playlist_id=playlist_id,
        metadata_multihash=params.metadata_cid,
        playlist_owner_id=params.user_id,
        is_album=metadata.get("is_album", False),
        description=metadata["description"],
        playlist_image_multihash=metadata["playlist_image_sizes_multihash"],
        playlist_image_sizes_multihash=metadata["playlist_image_sizes_multihash"],
        playlist_name=metadata["playlist_name"],
        is_private=metadata.get("is_private", False),
        playlist_contents={"track_ids": tracks_with_index_time},
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        blocknumber=params.block_number,
        blockhash=params.event_blockhash,
        txhash=params.txhash,
        last_added_to=last_added_to,
        is_current=False,
        is_delete=False,
    )

    update_playlist_routes_table(
        params.session, create_playlist_record, params.pending_playlist_routes
    )

    params.add_playlist_record(playlist_id, create_playlist_record)

    if tracks:
        dispatch_challenge_playlist_upload(
            params.challenge_bus, params.block_number, create_playlist_record
        )


def dispatch_challenge_playlist_upload(
    bus: ChallengeEventBus, block_number: int, playlist_record: Playlist
):
    # Adds challenge for creating your first playlist and adding a track to it.
    bus.dispatch(
        ChallengeEvent.first_playlist, block_number, playlist_record.playlist_owner_id
    )


def update_playlist(params: ManageEntityParameters):
    validate_playlist_tx(params)
    # TODO ignore updates on deleted playlists?

    playlist_id = params.entity_id
    metadata = params.metadata[params.metadata_cid]
    existing_playlist = params.existing_records[EntityType.PLAYLIST][playlist_id]
    if (
        playlist_id in params.new_records[EntityType.PLAYLIST]
    ):  # override with last updated playlist is in this block
        existing_playlist = params.new_records[EntityType.PLAYLIST][playlist_id][-1]

    updated_playlist = copy_record(
        existing_playlist,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    process_playlist_data_event(
        updated_playlist,
        metadata,
        params.block_integer_time,
        params.block_datetime,
        params.metadata_cid,
    )

    update_playlist_routes_table(
        params.session, updated_playlist, params.pending_playlist_routes
    )

    params.add_playlist_record(playlist_id, updated_playlist)

    if updated_playlist.playlist_contents["track_ids"]:
        dispatch_challenge_playlist_upload(
            params.challenge_bus, params.block_number, updated_playlist
        )


def delete_playlist(params: ManageEntityParameters):
    validate_playlist_tx(params)

    existing_playlist = params.existing_records[EntityType.PLAYLIST][params.entity_id]
    if params.entity_id in params.new_records[EntityType.PLAYLIST]:
        # override with last updated playlist is in this block
        existing_playlist = params.new_records[EntityType.PLAYLIST][params.entity_id][
            -1
        ]

    deleted_playlist = copy_record(
        existing_playlist,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_playlist.is_delete = True

    params.new_records[EntityType.PLAYLIST][params.entity_id].append(deleted_playlist)


def process_playlist_contents(playlist_record, playlist_metadata, block_integer_time):
    if playlist_record.metadata_multihash:
        # playlist already has metadata
        metadata_index_time_dict: Dict[int, Dict[int, int]] = defaultdict(dict)
        for track in playlist_record.playlist_contents["track_ids"]:
            track_id = track["track"]
            metadata_time = track["metadata_time"]
            metadata_index_time_dict[track_id][metadata_time] = track["time"]

        updated_tracks = []
        for track in playlist_metadata["playlist_contents"]["track_ids"]:
            track_id = track["track"]
            metadata_time = track["time"]
            index_time = block_integer_time  # default to current block for new tracks

            if (
                track_id in metadata_index_time_dict
                and metadata_time in metadata_index_time_dict[track_id]
            ):
                # track exists in prev record (reorder / delete)
                index_time = metadata_index_time_dict[track_id][metadata_time]

            updated_tracks.append(
                {
                    "track": track_id,
                    "time": index_time,
                    "metadata_time": metadata_time,
                }
            )
    else:
        # upgrade legacy playlist to include metadata
        # assume metadata and indexing timestamp is the same
        track_id_index_times: Set = set()
        for track in playlist_record.playlist_contents["track_ids"]:
            track_id = track["track"]
            index_time = track["time"]
            track_id_index_times.add((track_id, index_time))

        updated_tracks = []
        for track in playlist_metadata["playlist_contents"]["track_ids"]:
            track_id = track["track"]
            metadata_time = track["time"]

            # use track["time"] if present in previous record else this is a new track
            index_time = (
                track["time"]
                if (track_id, metadata_time) in track_id_index_times
                else block_integer_time
            )
            updated_tracks.append(
                {
                    "track": track_id,
                    "time": index_time,
                    "metadata_time": metadata_time,
                }
            )

    return {"track_ids": updated_tracks}


def process_playlist_data_event(
    playlist_record,
    playlist_metadata,
    block_integer_time,
    block_datetime,
    metadata_cid,
):
    playlist_record.is_album = (
        playlist_metadata["is_album"] if "is_album" in playlist_metadata else False
    )
    playlist_record.description = playlist_metadata["description"]
    playlist_record.playlist_image_multihash = playlist_metadata[
        "playlist_image_sizes_multihash"
    ]
    playlist_record.playlist_image_sizes_multihash = playlist_metadata[
        "playlist_image_sizes_multihash"
    ]
    playlist_record.playlist_name = playlist_metadata["playlist_name"]
    playlist_record.is_private = (
        playlist_metadata["is_private"] if "is_private" in playlist_metadata else False
    )
    playlist_record.playlist_contents = process_playlist_contents(
        playlist_record, playlist_metadata, block_integer_time
    )

    playlist_record.last_added_to = None
    track_ids = playlist_record.playlist_contents["track_ids"]
    if track_ids:
        last_added_to = track_ids[0]["time"]
        for track_obj in playlist_record.playlist_contents["track_ids"]:
            if track_obj["time"] > last_added_to:
                last_added_to = track_obj["time"]
        playlist_record.last_added_to = datetime.utcfromtimestamp(last_added_to)

    playlist_record.updated_at = block_datetime
    playlist_record.metadata_multihash = metadata_cid

    logger.info(
        f"playlist.py | EntityManager | Updated playlist record {playlist_record}"
    )
