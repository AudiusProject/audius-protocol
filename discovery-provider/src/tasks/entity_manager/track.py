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
)
from src.tasks.tracks import (
    dispatch_challenge_track_upload,
    populate_track_record_metadata,
    update_remixes_table,
    update_stems_table,
    update_track_routes_table,
)

logger = logging.getLogger(__name__)


def is_valid_track_tx(params: ManageEntityParameters):
    user_id = params.user_id
    track_id = params.entity_id
    if user_id not in params.existing_records[EntityType.USER]:
        # user does not exist
        return False

    wallet = params.existing_records[EntityType.USER][user_id].wallet
    if wallet and wallet.lower() != params.signer.lower():
        # user does not match signer
        return False

    if params.entity_type != EntityType.TRACK:
        return False

    if params.action == Action.CREATE:
        if track_id in params.existing_records[EntityType.TRACK]:
            # playlist already exists
            return False
        if track_id < TRACK_ID_OFFSET:
            return False
    else:
        # update / delete specific validations
        if track_id not in params.existing_records[EntityType.TRACK]:
            # playlist does not exist
            return False
        existing_track: Track = params.existing_records[EntityType.TRACK][track_id]
        if existing_track.owner_id != params.user_id:
            # existing playlist does not match user
            return False

    return True


def copy_track_record(
    old_track: Track, block_number: int, event_blockhash: str, txhash: str
):
    return Track(
        track_id=old_track.track_id,
        owner_id=old_track.owner_id,
        title=old_track.title,
        length=old_track.length,
        cover_art=old_track.cover_art,
        tags=old_track.tags,
        genre=old_track.genre,
        mood=old_track.mood,
        credits_splits=old_track.credits_splits,
        create_date=old_track.create_date,
        release_date=old_track.release_date,
        file_type=old_track.file_type,
        metadata_multihash=old_track.metadata_multihash,
        track_segments=old_track.track_segments,
        description=old_track.description,
        isrc=old_track.isrc,
        iswc=old_track.iswc,
        license=old_track.license,
        cover_art_sizes=old_track.cover_art_sizes,
        download=old_track.download,
        is_unlisted=old_track.is_unlisted,
        field_visibility=old_track.field_visibility,
        route_id=old_track.route_id,
        stem_of=old_track.stem_of,
        remix_of=old_track.remix_of,
        is_available=old_track.is_available,
        is_delete=old_track.is_delete,
        created_at=old_track.created_at,
        updated_at=old_track.updated_at,
        blocknumber=block_number,
        blockhash=event_blockhash,
        txhash=txhash,
        is_current=False,
    )


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
    if not is_valid_track_tx(params):
        return

    track_id = params.entity_id
    owner_id = params.user_id
    track_metadata = params.ipfs_metadata[params.metadata_cid]

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
    if not is_valid_track_tx(params):
        return
    # TODO ignore updates on deleted playlists?

    track_metadata = params.ipfs_metadata[params.metadata_cid]
    track_id = params.entity_id
    existing_track = params.existing_records[EntityType.TRACK][track_id]
    existing_track.is_current = False  # invalidate
    if (
        track_id in params.new_records[EntityType.TRACK]
    ):  # override with last updated playlist is in this block
        existing_track = params.new_records[EntityType.TRACK][track_id][-1]

    updated_track = copy_track_record(
        existing_track, params.block_number, params.event_blockhash, params.txhash
    )

    update_track_routes_table(
        params.session, updated_track, track_metadata, params.pending_track_routes
    )
    update_track_record(params, updated_track, track_metadata)
    update_remixes_table(params.session, updated_track, track_metadata)

    params.add_track_record(track_id, updated_track)


def delete_track(params: ManageEntityParameters):
    if not is_valid_track_tx(params):
        return

    track_id = params.entity_id
    existing_track = params.existing_records[EntityType.TRACK][track_id]
    existing_track.is_current = False  # invalidate old playlist
    if params.entity_id in params.new_records[EntityType.TRACK]:
        # override with last updated playlist is in this block
        existing_track = params.new_records[EntityType.TRACK][params.entity_id][-1]

    deleted_track = copy_track_record(
        existing_track, params.block_number, params.event_blockhash, params.txhash
    )
    deleted_track.is_delete = True
    deleted_track.stem_of = null()
    deleted_track.remix_of = null()
    deleted_track.premium_conditions = null()

    params.add_track_record(track_id, deleted_track)
