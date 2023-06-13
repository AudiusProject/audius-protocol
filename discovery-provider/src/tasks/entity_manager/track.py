import logging
from typing import Dict

from sqlalchemy.sql import null
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.models.tracks.remix import Remix
from src.models.tracks.stem import Stem
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.tasks.entity_manager.utils import (
    CHARACTER_LIMIT_TRACK_DESCRIPTION,
    TRACK_ID_OFFSET,
    Action,
    EntityType,
    ManageEntityParameters,
    copy_record,
)
from src.tasks.index_trending import GENRE_ALLOWLIST
from src.tasks.task_helpers import generate_slug_and_collision_id
from src.utils import helpers

logger = logging.getLogger(__name__)


def update_stems_table(session, track_record, track_metadata):
    if ("stem_of" not in track_metadata) or (
        not isinstance(track_metadata["stem_of"], dict)
    ):
        return
    parent_track_id = track_metadata["stem_of"].get("parent_track_id")
    if not isinstance(parent_track_id, int):
        return

    # Avoid re-adding stem if it already exists
    existing_stem = (
        session.query(Stem)
        .filter_by(
            parent_track_id=parent_track_id, child_track_id=track_record.track_id
        )
        .first()
    )
    if existing_stem:
        return

    stem = Stem(parent_track_id=parent_track_id, child_track_id=track_record.track_id)
    session.add(stem)


def update_remixes_table(session, track_record, track_metadata):
    child_track_id = track_record.track_id

    # Delete existing remix parents
    session.query(Remix).filter_by(child_track_id=child_track_id).delete()

    # Add all remixes
    if "remix_of" in track_metadata and isinstance(track_metadata["remix_of"], dict):
        tracks = track_metadata["remix_of"].get("tracks")
        if tracks and isinstance(tracks, list):
            for track in tracks:
                if not isinstance(track, dict):
                    continue
                parent_track_id = track.get("parent_track_id")
                if isinstance(parent_track_id, int):
                    remix = Remix(
                        parent_track_id=parent_track_id, child_track_id=child_track_id
                    )
                    session.add(remix)


@helpers.time_method
def update_track_routes_table(
    session, track_record, track_metadata, pending_track_routes
):
    """Creates the route for the given track"""

    # Check if the title is staying the same, and if so, return early
    if track_record.title == track_metadata["title"]:
        return

    # Get the title slug, and set the new slug to that
    # (will check for conflicts later)
    new_track_slug_title = helpers.sanitize_slug(
        track_metadata["title"], track_record.track_id
    )
    new_track_slug = new_track_slug_title

    # Find the current route for the track
    # Check the pending track route updates first
    prev_track_route_record = next(
        (
            route
            for route in pending_track_routes
            if route.is_current and route.track_id == track_record.track_id
        ),
        None,
    )

    # Then query the DB if necessary
    if prev_track_route_record is None:
        prev_track_route_record = (
            session.query(TrackRoute)
            .filter(
                TrackRoute.track_id == track_record.track_id,
                TrackRoute.is_current == True,
            )  # noqa: E712
            .one_or_none()
        )

    if prev_track_route_record is not None:
        if prev_track_route_record.title_slug == new_track_slug_title:
            # If the title slug hasn't changed, we have no work to do
            return
        # The new route will be current
        prev_track_route_record.is_current = False

    new_track_slug, new_collision_id = generate_slug_and_collision_id(
        session,
        TrackRoute,
        track_record.track_id,
        track_metadata["title"],
        track_record.owner_id,
        pending_track_routes,
        new_track_slug_title,
        new_track_slug,
    )

    # Add the new track route
    new_track_route = TrackRoute()
    new_track_route.slug = new_track_slug
    new_track_route.title_slug = new_track_slug_title
    new_track_route.collision_id = new_collision_id
    new_track_route.owner_id = track_record.owner_id
    new_track_route.track_id = track_record.track_id
    new_track_route.is_current = True
    new_track_route.blockhash = track_record.blockhash
    new_track_route.blocknumber = track_record.blocknumber
    new_track_route.txhash = track_record.txhash
    session.add(new_track_route)

    # Add to pending track routes so we don't add the same route twice
    pending_track_routes.append(new_track_route)


def dispatch_challenge_track_upload(
    bus: ChallengeEventBus, block_number: int, track_record
):
    bus.dispatch(ChallengeEvent.track_upload, block_number, track_record.owner_id)


def is_valid_json_field(metadata, field):
    if field in metadata and isinstance(metadata[field], dict) and metadata[field]:
        return True
    return False


def populate_track_record_metadata(track_record, track_metadata, handle):
    track_record.track_cid = track_metadata["track_cid"]
    track_record.title = track_metadata["title"]
    track_record.duration = track_metadata.get("duration", 0) or 0
    track_record.length = track_metadata.get("length", 0) or 0
    track_record.cover_art = track_metadata["cover_art"]
    if track_metadata["cover_art_sizes"]:
        track_record.cover_art = track_metadata["cover_art_sizes"]
    track_record.tags = track_metadata["tags"]
    track_record.genre = track_metadata["genre"]
    track_record.mood = track_metadata["mood"]
    track_record.credits_splits = track_metadata["credits_splits"]
    track_record.create_date = track_metadata["create_date"]
    track_record.release_date = track_metadata["release_date"]
    track_record.file_type = track_metadata["file_type"]
    track_record.description = track_metadata["description"]
    track_record.license = track_metadata["license"]
    track_record.isrc = track_metadata["isrc"]
    track_record.iswc = track_metadata["iswc"]
    track_record.track_segments = track_metadata["track_segments"]
    track_record.is_unlisted = track_metadata["is_unlisted"]
    track_record.field_visibility = track_metadata["field_visibility"]

    track_record.is_premium = track_metadata["is_premium"]
    track_record.is_playlist_upload = track_metadata["is_playlist_upload"]
    if is_valid_json_field(track_metadata, "premium_conditions"):
        track_record.premium_conditions = track_metadata["premium_conditions"]
    else:
        track_record.premium_conditions = null()

    if is_valid_json_field(track_metadata, "stem_of"):
        track_record.stem_of = track_metadata["stem_of"]
    else:
        track_record.stem_of = null()
    if is_valid_json_field(track_metadata, "remix_of"):
        track_record.remix_of = track_metadata["remix_of"]
    else:
        track_record.remix_of = null()

    if "download" in track_metadata:
        track_record.download = {
            "is_downloadable": track_metadata["download"].get("is_downloadable")
            == True,
            "requires_follow": track_metadata["download"].get("requires_follow")
            == True,
            "cid": track_metadata["download"].get("cid", None),
        }
    else:
        track_record.download = {
            "is_downloadable": False,
            "requires_follow": False,
            "cid": None,
        }

    track_record.route_id = helpers.create_track_route_id(
        track_metadata["title"], handle
    )

    track_record.ai_attribution_user_id = track_metadata.get("ai_attribution_user_id")
    return track_record


def validate_track_tx(params: ManageEntityParameters):
    user_id = params.user_id
    track_id = params.entity_id
    if user_id not in params.existing_records[EntityType.USER]:
        raise Exception(f"User {user_id} does not exist")

    # Ensure the signer is either the user or authorized to perform action for the user
    # TODO (nkang) - Extract to helper
    wallet = params.existing_records[EntityType.USER][user_id].wallet
    signer = params.signer.lower()
    signer_matches_user = wallet and wallet.lower() == signer

    if not signer_matches_user:
        grant_key = (signer, user_id)
        is_signer_authorized = grant_key in params.existing_records[EntityType.GRANT]
        if is_signer_authorized:
            grant = params.existing_records[EntityType.GRANT][grant_key]
            developer_app = params.existing_records[EntityType.DEVELOPER_APP][signer]
            if (not developer_app) or (developer_app.is_delete) or (grant.is_revoked):
                raise Exception(
                    f"Signer is not authorized to perform action for user {user_id}"
                )
        else:
            raise Exception(
                f"Signer does not match user {user_id} or an authorized wallet"
            )

    if params.entity_type != EntityType.TRACK:
        raise Exception(f"Entity type {params.entity_type} is not a track")

    if params.action == Action.CREATE:
        if track_id in params.existing_records[EntityType.TRACK]:
            raise Exception(f"Track {track_id} already exists")

        if track_id < TRACK_ID_OFFSET:
            raise Exception(f"Cannot create track {track_id} below the offset")
    if params.action == Action.CREATE or params.action == Action.UPDATE:
        track_metadata = params.metadata[params.metadata_cid]
        track_bio = track_metadata["description"]
        track_genre = track_metadata["genre"]
        logger.warn(f"track metadata {track_metadata}")
        if track_genre is not None and track_genre not in GENRE_ALLOWLIST:
            raise Exception(f"Track {track_id} attempted to be placed in genre '{track_genre}' which is not in the allow list")
        if track_bio is not None and len(track_bio) > CHARACTER_LIMIT_TRACK_DESCRIPTION:
            raise Exception(f"Track {track_id} description exceeds character limit {CHARACTER_LIMIT_TRACK_DESCRIPTION}")
    else:
        # update / delete specific validations
        if track_id not in params.existing_records[EntityType.TRACK]:
            raise Exception(f"Track {track_id} does not exist")
        existing_track: Track = params.existing_records[EntityType.TRACK][track_id]
        if existing_track.owner_id != params.user_id:
            raise Exception(f"Existing track {track_id} does not match user")

    if params.action != Action.DELETE:
        track_metadata = params.metadata[params.metadata_cid]
        ai_attribution_user_id = track_metadata.get("ai_attribution_user_id")
        if ai_attribution_user_id:
            ai_attribution_user = params.existing_records[EntityType.USER][
                ai_attribution_user_id
            ]
            if not ai_attribution_user or not ai_attribution_user.allow_ai_attribution:
                raise Exception(f"Cannot AI attribute user {ai_attribution_user}")
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
