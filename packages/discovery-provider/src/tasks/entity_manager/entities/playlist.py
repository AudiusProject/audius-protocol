from datetime import datetime

from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.exceptions import IndexingValidationError
from src.models.playlists.playlist import Playlist
from src.models.playlists.playlist_route import PlaylistRoute
from src.models.playlists.playlists_tracks_relations import PlaylistsTracksRelations
from src.tasks.entity_manager.utils import (
    CHARACTER_LIMIT_DESCRIPTION,
    PLAYLIST_ID_OFFSET,
    PLAYLIST_TRACK_LIMIT,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
    validate_signer,
)
from src.tasks.metadata import immutable_playlist_fields
from src.tasks.task_helpers import generate_slug_and_collision_id
from src.utils import helpers


def update_playlist_routes_table(
    params: ManageEntityParameters, playlist_record: Playlist, is_create: bool
):
    pending_playlist_routes = params.pending_playlist_routes
    session = params.session

    params.logger.info(
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

    # Then query the DB if necessary
    prev_playlist_route_record = params.existing_records["PlaylistRoute"].get(
        playlist_record.playlist_id
    )

    if prev_playlist_route_record:
        if prev_playlist_route_record.title_slug == new_playlist_slug_title:
            # If the title slug hasn't changed, we have no work to do
            params.logger.info(f"not changing for {playlist_record.playlist_id}")
            return

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

    if is_create:
        # playlist-name-<id>
        migration_playlist_slug_title = helpers.sanitize_slug(
            playlist_record.playlist_name,
            playlist_record.playlist_id,
            playlist_record.playlist_id,
        )
        migration_playlist_slug = migration_playlist_slug_title

        migration_playlist_route = PlaylistRoute()
        migration_playlist_route.slug = migration_playlist_slug
        migration_playlist_route.title_slug = migration_playlist_slug_title
        migration_playlist_route.collision_id = new_collision_id
        migration_playlist_route.owner_id = playlist_record.playlist_owner_id
        migration_playlist_route.playlist_id = playlist_record.playlist_id
        migration_playlist_route.is_current = False
        migration_playlist_route.blockhash = playlist_record.blockhash
        migration_playlist_route.blocknumber = playlist_record.blocknumber
        migration_playlist_route.txhash = playlist_record.txhash
        params.add_record(
            migration_playlist_route.playlist_id,
            migration_playlist_route,
            EntityType.PLAYLIST_ROUTE,
        )

    params.add_record(
        new_playlist_route.playlist_id, new_playlist_route, EntityType.PLAYLIST_ROUTE
    )

    # Add to pending playlist routes so we don't add the same route twice
    pending_playlist_routes.append(new_playlist_route)

    params.logger.info(
        f"index.py | playlists.py | Updated playlist routes for {playlist_record.playlist_id} with slug {new_playlist_slug} and owner_id {new_playlist_route.owner_id}"
    )


def update_playlist_tracks_relations(
    params: ManageEntityParameters, playlist_record: Playlist
):
    # debug
    try:
        # Update the playlist_tracks_relations table
        session = params.session
        existing_playlist_tracks_relations = (
            session.query(PlaylistsTracksRelations)
            .filter(
                PlaylistsTracksRelations.playlist_id == params.entity_id,
                # PlaylistsTracksRelations.is_delete == False,
            )
            .all()
        )
        existing_tracks = {
            track.track_id: track for track in existing_playlist_tracks_relations
        }
        params.logger.info(
            f"playlists.py | REED playlist_record.playlist_contents['track_ids']: {playlist_record.playlist_contents['track_ids']}"
        )
        updated_track_ids = [
            track["track"] for track in playlist_record.playlist_contents["track_ids"]
        ]
        params.logger.info(
            f"playlists.py | REED existing_tracks: {existing_tracks} updated_track_ids: {updated_track_ids}"
        )
        params.logger.info(
            f"playlists.py | Updating playlist tracks relations for {playlist_record.playlist_id}"
        )

        for relation in existing_playlist_tracks_relations:
            if relation.track_id not in updated_track_ids:
                params.logger.info(
                    "REED marking relation as deleted: ", relation.track_id
                )
                # setting values on the relation will update the record in the database
                relation.is_delete = True

        # add row for each track that is not already in the table
        for track_id in updated_track_ids:
            if track_id not in existing_tracks:
                params.logger.info(f"REED adding new relation {track_id}")
                new_playlist_track_relation = PlaylistsTracksRelations(
                    playlist_id=playlist_record.playlist_id,
                    track_id=track_id,
                    is_delete=False,
                    created_at=params.block_datetime,
                )
                # upsert to handle duplicates
                session.merge(new_playlist_track_relation)
            elif existing_tracks[track_id].is_delete:
                # recover deleted relation
                params.logger.info(f"REED undeleting relation {track_id}")
                existing_tracks[track_id].is_delete = False

        params.logger.info(
            f"playlists.py | Updated playlist tracks relations for {playlist_record.playlist_id}"
        )
    except Exception as e:
        params.logger.error(f"playlists.py | REED | error {e}")


def get_playlist_events_tx(update_task, event_type, tx_receipt):
    return getattr(update_task.playlist_contract.events, event_type)().process_receipt(
        tx_receipt
    )


def validate_playlist_tx(params: ManageEntityParameters):
    user_id = params.user_id
    playlist_id = params.entity_id

    validate_signer(params)

    if params.entity_type != EntityType.PLAYLIST:
        raise IndexingValidationError(
            f"Entity type {params.entity_type} is not a playlist"
        )

    stream_gated_tracks = list(
        filter(
            lambda track: track.is_stream_gated,
            params.existing_records["Track"].values(),
        )
    )
    if stream_gated_tracks:
        raise IndexingValidationError("Cannot add gated tracks to playlist")

    if params.action == Action.CREATE:
        if playlist_id in params.existing_records["Playlist"]:
            raise IndexingValidationError(
                f"Cannot create playlist {playlist_id} that already exists"
            )
        if playlist_id < PLAYLIST_ID_OFFSET:
            raise IndexingValidationError(
                f"Cannot create playlist {playlist_id} below the offset"
            )
    else:
        if playlist_id not in params.existing_records["Playlist"]:
            raise IndexingValidationError(
                f"Cannot update playlist {playlist_id} that does not exist"
            )
        existing_playlist: Playlist = params.existing_records["Playlist"][playlist_id]
        if existing_playlist.playlist_owner_id != user_id:
            raise IndexingValidationError(
                f"Cannot update playlist {playlist_id} that does not belong to user {user_id}"
            )
    if params.action == Action.CREATE or params.action == Action.UPDATE:
        if not params.metadata:
            raise IndexingValidationError(
                "Metadata is required for playlist creation and update"
            )
        playlist_description = params.metadata.get("description")
        if (
            playlist_description
            and len(playlist_description) > CHARACTER_LIMIT_DESCRIPTION
        ):
            raise IndexingValidationError(
                f"Playlist {playlist_id} description exceeds character limit {CHARACTER_LIMIT_DESCRIPTION}"
            )
        if params.metadata.get("playlist_contents"):
            if (
                "playlist_contents" not in params.metadata
                or "track_ids" not in params.metadata["playlist_contents"]
            ):
                raise IndexingValidationError("playlist contents requires track_ids")
            playlist_track_count = len(
                params.metadata["playlist_contents"]["track_ids"]
            )
            if playlist_track_count > PLAYLIST_TRACK_LIMIT:
                raise IndexingValidationError(
                    f"Playlist {playlist_id} exceeds track limit {PLAYLIST_TRACK_LIMIT}"
                )

        if (
            params.action == Action.UPDATE
            and not existing_playlist.is_private
            and params.metadata.get("is_private")
        ):
            raise IndexingValidationError(f"Cannot unlist playlist {playlist_id}")


def create_playlist(params: ManageEntityParameters):
    validate_playlist_tx(params)

    playlist_id = params.entity_id
    tracks = params.metadata["playlist_contents"].get("track_ids", [])
    tracks_with_index_time = []
    last_added_to = None
    for track in tracks:
        if "track" not in track or "time" not in track:
            raise IndexingValidationError(
                f"Cannot add {track} to playlist {playlist_id}"
            )

        tracks_with_index_time.append(
            {
                "track": track["track"],
                "metadata_time": track["time"],
                "time": params.block_integer_time,
            }
        )
        last_added_to = params.block_datetime
    playlist_record = Playlist(
        playlist_id=playlist_id,
        metadata_multihash=params.metadata_cid,
        playlist_owner_id=params.user_id,
        is_album=params.metadata.get("is_album", False),
        description=params.metadata["description"],
        playlist_image_multihash=params.metadata["playlist_image_sizes_multihash"],
        playlist_image_sizes_multihash=params.metadata[
            "playlist_image_sizes_multihash"
        ],
        playlist_name=params.metadata["playlist_name"],
        is_private=params.metadata.get("is_private", False),
        is_image_autogenerated=params.metadata.get("is_image_autogenerated", False),
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

    update_playlist_routes_table(params, playlist_record, True)

    params.add_record(playlist_id, playlist_record)

    update_playlist_tracks_relations(params, playlist_record)

    if tracks:
        dispatch_challenge_playlist_upload(
            params.challenge_bus, params.block_number, playlist_record
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
    existing_playlist = params.existing_records["Playlist"][playlist_id]
    if (
        playlist_id in params.new_records["Playlist"]
    ):  # override with last updated playlist is in this block
        existing_playlist = params.new_records["Playlist"][playlist_id][-1]

    playlist_record = copy_record(
        existing_playlist,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    process_playlist_data_event(params, playlist_record)

    update_playlist_routes_table(params, playlist_record, False)

    params.logger.info("REED before update: ")
    update_playlist_tracks_relations(params, playlist_record)

    params.add_record(playlist_id, playlist_record)

    if playlist_record.playlist_contents["track_ids"]:
        dispatch_challenge_playlist_upload(
            params.challenge_bus, params.block_number, playlist_record
        )


def delete_playlist(params: ManageEntityParameters):
    validate_playlist_tx(params)

    existing_playlist = params.existing_records["Playlist"][params.entity_id]
    if params.entity_id in params.new_records["Playlist"]:
        # override with last updated playlist is in this block
        existing_playlist = params.new_records["Playlist"][params.entity_id][-1]

    deleted_playlist = copy_record(
        existing_playlist,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_playlist.is_delete = True

    params.add_record(params.entity_id, deleted_playlist)


def process_playlist_contents(
    playlist_record, playlist_metadata, block_integer_time, existing_track_records
):
    updated_tracks = []
    for track in playlist_metadata["playlist_contents"]["track_ids"]:
        track_id = track["track"]
        metadata_time = track["time"]
        index_time = block_integer_time  # default to current block for new tracks

        track_metadata = existing_track_records.get(track_id)
        if playlist_record.is_album and (
            not track_metadata
            or (track_metadata.owner_id != playlist_record.playlist_owner_id)
        ):
            continue

        previous_playlist_tracks = playlist_record.playlist_contents["track_ids"]
        for previous_track in previous_playlist_tracks:
            previous_track_id = previous_track["track"]
            previous_track_time = (
                previous_track.get("metadata_time") or previous_track["time"]
            )
            if previous_track_id == track_id and previous_track_time == metadata_time:
                index_time = previous_track_time

        updated_tracks.append(
            {
                "track": track_id,
                "time": index_time,
                "metadata_time": metadata_time,
            }
        )

    return {"track_ids": updated_tracks}


def process_playlist_data_event(
    params: ManageEntityParameters,
    playlist_record,
):
    playlist_metadata = params.metadata
    block_integer_time = params.block_integer_time
    block_datetime = params.block_datetime
    metadata_cid = params.metadata_cid

    # Iterate over the playlist_record keys
    playlist_record_attributes = playlist_record.get_attributes_dict()
    for key, _ in playlist_record_attributes.items():
        # Update the playlist_record when the corresponding field exists
        # in playlist_metadata
        if key == "playlist_contents":
            if not playlist_metadata.get(key):
                continue
            playlist_record.playlist_contents = process_playlist_contents(
                playlist_record,
                playlist_metadata,
                block_integer_time,
                params.existing_records["Track"],
            )
        elif key in playlist_metadata:
            if key in immutable_playlist_fields and params.action == Action.UPDATE:
                # skip fields that cannot be modified after creation
                continue
            setattr(playlist_record, key, playlist_metadata[key])
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

    params.logger.info(
        f"playlist.py | EntityManager | Updated playlist record {playlist_record}"
    )
