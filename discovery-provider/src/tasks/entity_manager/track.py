import logging
from typing import Dict

from sqlalchemy.sql import null
from src.models.tracks.track import Track
from src.models.users.user import User
from src.tasks.entity_manager.utils import (
    TRACK_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.tasks.tracks import (
    dispatch_challenge_track_upload,
    populate_track_record_metadata,
    update_remixes_table,
    update_stems_table,
    update_track_routes_table,
)

logger = logging.getLogger(__name__)


def validate_track_tx(params: ManageEntityParameters):
    user_id = params.user_id
    track_id = params.entity_id
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(f"User {user_id} does not exist")

    wallet = params.existing_records[EntityType.USER][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        raise Exception(f"User {user_id} does not match signer")

    if params.entity_type != EntityType.TRACK:
        raise Exception(f"Entity type {params.entity_type} is not a track")

    if params.action == Action.CREATE:
        if track_id in params.existing_records[EntityType.TRACK]:
            raise Exception(f"Track {track_id} already exists")

        if track_id < TRACK_ID_OFFSET:
            raise Exception(f"Cannot create track {track_id} below the offset")
    else:
        # update / delete specific validations
        if track_id not in params.existing_records[EntityType.TRACK]:
            raise Exception(f"Track {track_id} does not exist")
        existing_track: Track = params.existing_records[EntityType.TRACK][track_id]
        if existing_track.owner_id != params.user_id:
            raise Exception(f"Existing track {track_id} does not match user")

    return True


def get_handle(params: ManageEntityParameters):
    # TODO: get the track owner user handle
    handle = (
        params.session.query(User.handle)
        .filter(User.user_id == params.user_id, User.is_current == True)
        .first()
    )[0]
    if not handle:
        logger.error("missing track user in entity manager handle track")
    return handle


def update_track_record(params: ManageEntityParameters, track: Track, metadata: Dict):
    handle = get_handle(params)
    populate_track_record_metadata(track, metadata, handle)
    track.metadata_multihash = params.metadata_cid
    # if cover_art CID is of a dir, store under _sizes field instead
    if track.cover_art:
        logger.info(
            f"index.py | tracks.py | Processing track cover art {track.cover_art}"
        )
        track.cover_art_sizes = track.cover_art
        track.cover_art = None


def create_track(params: ManageEntityParameters):
    validate_track_tx(params)

    track_id = params.entity_id
    owner_id = params.user_id
    track_metadata = params.metadata[params.metadata_cid]

    track_record = Track(
        track_id=track_id,
        owner_id=owner_id,
        txhash=params.txhash,
        blockhash=params.event_blockhash,
        blocknumber=params.block_number,
        created_at=params.block_datetime,
        updated_at=params.block_datetime,
        is_delete=False,
    )

    update_track_routes_table(
        params.session, track_record, track_metadata, params.pending_track_routes
    )

    update_track_record(params, track_record, track_metadata)

    update_stems_table(params.session, track_record, track_metadata)
    update_remixes_table(params.session, track_record, track_metadata)
    dispatch_challenge_track_upload(
        params.challenge_bus, params.block_number, track_record
    )

    params.add_track_record(track_id, track_record)


def update_track(params: ManageEntityParameters):
    validate_track_tx(params)

    track_metadata = params.metadata[params.metadata_cid]
    track_id = params.entity_id
    existing_track = params.existing_records[EntityType.TRACK][track_id]
    if (
        track_id in params.new_records[EntityType.TRACK]
    ):  # override with last updated track is in this block
        existing_track = params.new_records[EntityType.TRACK][track_id][-1]

    updated_track = copy_record(
        existing_track,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )

    update_track_routes_table(
        params.session, updated_track, track_metadata, params.pending_track_routes
    )
    update_track_record(params, updated_track, track_metadata)
    update_remixes_table(params.session, updated_track, track_metadata)

    params.add_track_record(track_id, updated_track)


def delete_track(params: ManageEntityParameters):
    validate_track_tx(params)

    track_id = params.entity_id
    existing_track = params.existing_records[EntityType.TRACK][track_id]
    if params.entity_id in params.new_records[EntityType.TRACK]:
        # override with last updated playlist is in this block
        existing_track = params.new_records[EntityType.TRACK][params.entity_id][-1]

    deleted_track = copy_record(
        existing_track,
        params.block_number,
        params.event_blockhash,
        params.txhash,
        params.block_datetime,
    )
    deleted_track.is_delete = True
    deleted_track.stem_of = null()
    deleted_track.remix_of = null()
    deleted_track.premium_conditions = null()

    params.add_track_record(track_id, deleted_track)
