import logging
from datetime import datetime
from time import time
from typing import Any, Dict, List, Optional, Set, Tuple

from sqlalchemy.orm.session import Session, make_transient
from sqlalchemy.sql import functions, null
from src.challenges.challenge_event import ChallengeEvent
from src.challenges.challenge_event_bus import ChallengeEventBus
from src.database_task import DatabaseTask
from src.models.tracks.remix import Remix
from src.models.tracks.stem import Stem
from src.models.tracks.track import Track
from src.models.tracks.track_route import TrackRoute
from src.models.users.user import User
from src.queries.skipped_transactions import add_node_level_skipped_transaction
from src.utils import helpers, multihash
from src.utils.indexing_errors import EntityMissingRequiredFieldError, IndexingError
from src.utils.model_nullable_validator import all_required_fields_present
from src.utils.prometheus_metric import PrometheusMetric, PrometheusMetricNames
from src.utils.track_event_constants import (
    track_event_types_arr,
    track_event_types_lookup,
)

logger = logging.getLogger(__name__)


def track_state_update(
    self,
    update_task: DatabaseTask,
    session: Session,
    track_factory_txs,
    block_number,
    block_timestamp,
    block_hash,
    ipfs_metadata,
) -> Tuple[int, Set]:
    """Return tuple containing int representing number of Track model state changes found in transaction and set of processed track IDs."""
    begin_track_state_update = datetime.now()
    metric = PrometheusMetric(PrometheusMetricNames.TRACK_STATE_UPDATE_DURATION_SECONDS)

    blockhash = update_task.web3.toHex(block_hash)
    num_total_changes = 0
    skipped_tx_count = 0
    # This stores the track_ids created or updated in the set of transactions
    track_ids: Set[int] = set()

    if not track_factory_txs:
        return num_total_changes, track_ids

    pending_track_routes: List[TrackRoute] = []
    track_events: Dict[int, Dict[str, Any]] = {}
    for tx_receipt in track_factory_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in track_event_types_arr:
            track_events_tx = get_track_events_tx(update_task, event_type, tx_receipt)
            processedEntries = 0  # if record does not get added, do not count towards num_total_changes
            for entry in track_events_tx:
                track_event_start_time = time()
                event_args = entry["args"]
                track_id = (
                    helpers.get_tx_arg(entry, "_trackId")
                    if "_trackId" in event_args
                    else helpers.get_tx_arg(entry, "_id")
                )
                existing_track_record = None
                track_metadata = None
                try:
                    # look up or populate existing record
                    if track_id in track_events:
                        existing_track_record = track_events[track_id]["track"]
                    else:
                        existing_track_record = lookup_track_record(
                            update_task,
                            session,
                            entry,
                            track_id,
                            block_number,
                            blockhash,
                            txhash,
                        )
                    # parse track event to add metadata to record
                    if event_type in [
                        track_event_types_lookup["new_track"],
                        track_event_types_lookup["update_track"],
                    ]:
                        track_metadata_digest = event_args._multihashDigest.hex()
                        track_metadata_hash_fn = event_args._multihashHashFn
                        buf = multihash.encode(
                            bytes.fromhex(track_metadata_digest), track_metadata_hash_fn
                        )
                        cid = multihash.to_b58_string(buf)
                        track_metadata = ipfs_metadata[cid]

                    parsed_track = parse_track_event(
                        self,
                        session,
                        update_task,
                        entry,
                        event_type,
                        existing_track_record,
                        block_number,
                        block_timestamp,
                        track_metadata,
                        pending_track_routes,
                    )

                    if parsed_track is not None:
                        if track_id not in track_events:
                            track_events[track_id] = {
                                "track": parsed_track,
                                "events": [],
                            }
                        else:
                            track_events[track_id]["track"] = parsed_track
                        track_events[track_id]["events"].append(event_type)
                        track_ids.add(track_id)
                        processedEntries += 1
                except EntityMissingRequiredFieldError as e:
                    logger.warning(f"Skipping tx {txhash} with error {e}")
                    skipped_tx_count += 1
                    add_node_level_skipped_transaction(
                        session, block_number, blockhash, txhash
                    )
                    pass
                except Exception as e:
                    logger.info("Error in parse track transaction")
                    raise IndexingError(
                        "track", block_number, blockhash, txhash, str(e)
                    ) from e
                metric.save_time(
                    {"scope": "track_event"}, start_time=track_event_start_time
                )

            num_total_changes += processedEntries

    logger.info(
        f"index.py | tracks.py | [track indexing] There are {num_total_changes} events processed and {skipped_tx_count} skipped transactions."
    )

    for track_id, value_obj in track_events.items():
        if value_obj["events"]:
            logger.info(f"index.py | tracks.py | Adding {value_obj['track']}")
            invalidate_old_track(session, track_id)
            session.add(value_obj["track"])

    if num_total_changes:
        metric.save_time({"scope": "full"})
        logger.info(
            f"index.py | tracks.py | track_state_update | finished track_state_update in {datetime.now() - begin_track_state_update} // per event: {(datetime.now() - begin_track_state_update) / num_total_changes} secs"
        )
    return num_total_changes, track_ids


def get_track_events_tx(update_task, event_type, tx_receipt):
    return getattr(update_task.track_contract.events, event_type)().processReceipt(
        tx_receipt
    )


def lookup_track_record(
    update_task, session, entry, event_track_id, block_number, block_hash, txhash
):
    # Check if track record exists
    track_exists = session.query(Track).filter_by(track_id=event_track_id).count() > 0

    track_record = None
    if track_exists:
        track_record = (
            session.query(Track)
            .filter(Track.track_id == event_track_id, Track.is_current == True)
            .first()
        )

        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(track_record)
        make_transient(track_record)
    else:
        track_record = Track(track_id=event_track_id, is_current=True, is_delete=False)

    # update block related fields regardless of type
    track_record.blocknumber = block_number
    track_record.blockhash = block_hash
    track_record.txhash = txhash
    return track_record


def invalidate_old_track(session, track_id):
    track_exists = session.query(Track).filter_by(track_id=track_id).count() > 0

    if not track_exists:
        return

    num_invalidated_tracks = (
        session.query(Track)
        .filter(Track.track_id == track_id, Track.is_current == True)
        .update({"is_current": False})
    )
    assert (
        num_invalidated_tracks > 0
    ), "Update operation requires a current track to be invalidated"


def invalidate_old_tracks(session, track_ids):
    for track_id in track_ids:
        invalidate_old_track(session, track_id)


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
    new_track_slug_title = helpers.create_track_slug(
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

    # Check for collisions by slug titles, and get the max collision_id
    max_collision_id: Optional[int] = None
    # Check pending updates first
    for route in pending_track_routes:
        if (
            route.title_slug == new_track_slug_title
            and route.owner_id == track_record.owner_id
        ):
            max_collision_id = (
                route.collision_id
                if max_collision_id is None
                else max(max_collision_id, route.collision_id)
            )
    # Check DB if necessary
    if max_collision_id is None:
        max_collision_id = (
            session.query(functions.max(TrackRoute.collision_id))
            .filter(
                TrackRoute.title_slug == new_track_slug_title,
                TrackRoute.owner_id == track_record.owner_id,
            )
            .one_or_none()
        )[0]

    existing_track_route: Optional[TrackRoute] = None
    # If the new track_slug ends in a digit, there's a possibility it collides
    # with an existing route when the collision_id is appended to its title_slug
    if new_track_slug[-1].isdigit():
        existing_track_route = next(
            (
                route
                for route in pending_track_routes
                if route.slug == new_track_slug
                and route.owner_id == track_record.owner_id
            ),
            None,
        )
        if existing_track_route is None:
            existing_track_route = (
                session.query(TrackRoute)
                .filter(
                    TrackRoute.slug == new_track_slug,
                    TrackRoute.owner_id == track_record.owner_id,
                )
                .one_or_none()
            )

    new_collision_id = 0
    has_collisions = existing_track_route is not None

    if max_collision_id is not None:
        has_collisions = True
        new_collision_id = max_collision_id
    while has_collisions:
        # If there is an existing track by the user with that slug,
        # then we need to append the collision number to the slug
        new_collision_id += 1
        new_track_slug = helpers.create_track_slug(
            track_metadata["title"], track_record.track_id, new_collision_id
        )

        # Check for new collisions after making the new slug
        # In rare cases the user may have track names that end in numbers that
        # conflict with this track name when the collision id is appended,
        # for example they could be trying to create a route that conflicts
        # with the old routing (of appending -{track_id}) This is a fail safe
        # to increment the collision ID until no such collisions are present.
        #
        # Example scenario:
        #   - User uploads track titled "Track" (title_slug: 'track')
        #   - User uploads track titled "Track 1" (title_slug: 'track-1')
        #   - User uploads track titled "Track" (title_slug: 'track')
        #       - Try collision_id: 1, slug: 'track-1' and find new collision
        #       - Use collision_id: 2, slug: 'track-2'
        #   - User uploads track titled "Track" (title_slug: 'track')
        #       - Use collision_id: 3, slug: 'track-3'
        #   - User uploads track titled "Track 1" (title_slug: 'track-1')
        #       - Use collision_id: 1, slug: 'track-1-1'
        #
        # This may be expensive with many collisions, but should be rare.
        existing_track_route = next(
            (
                route
                for route in pending_track_routes
                if route.slug == new_track_slug
                and route.owner_id == track_record.owner_id
            ),
            None,
        )
        if existing_track_route is None:
            existing_track_route = (
                session.query(TrackRoute)
                .filter(
                    TrackRoute.slug == new_track_slug,
                    TrackRoute.owner_id == track_record.owner_id,
                )
                .one_or_none()
            )
        has_collisions = existing_track_route is not None

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


def parse_track_event(
    self,
    session,
    update_task: DatabaseTask,
    entry,
    event_type,
    track_record,
    block_number,
    block_timestamp,
    track_metadata,
    pending_track_routes,
):
    challenge_bus = update_task.challenge_event_bus
    # Just use block_timestamp as integer
    block_datetime = datetime.utcfromtimestamp(block_timestamp)

    if event_type == track_event_types_lookup["new_track"]:
        track_record.created_at = block_datetime

        track_metadata_digest = helpers.get_tx_arg(entry, "_multihashDigest").hex()
        track_metadata_hash_fn = helpers.get_tx_arg(entry, "_multihashHashFn")
        buf = multihash.encode(
            bytes.fromhex(track_metadata_digest), track_metadata_hash_fn
        )
        track_metadata_multihash = multihash.to_b58_string(buf)
        logger.info(
            f"index.py | tracks.py | track metadata ipld : {track_metadata_multihash}"
        )

        owner_id = helpers.get_tx_arg(entry, "_trackOwnerId")
        track_record.owner_id = owner_id
        track_record.is_delete = False

        handle = (
            session.query(User.handle)
            .filter(User.user_id == owner_id, User.is_current == True)
            .first()
        )[0]
        if not handle:
            raise EntityMissingRequiredFieldError(
                "track",
                track_record,
                f"No user found for {track_record}",
            )

        update_track_routes_table(
            session, track_record, track_metadata, pending_track_routes
        )
        track_record = populate_track_record_metadata(
            track_record, track_metadata, handle
        )
        track_record.metadata_multihash = track_metadata_multihash

        # if cover_art CID is of a dir, store under _sizes field instead
        if track_record.cover_art:
            logger.info(
                f"index.py | tracks.py | Processing track cover art {track_record.cover_art}"
            )
            track_record.cover_art_sizes = track_record.cover_art
            track_record.cover_art = None

        update_stems_table(session, track_record, track_metadata)
        update_remixes_table(session, track_record, track_metadata)
        dispatch_challenge_track_upload(challenge_bus, block_number, track_record)

    if event_type == track_event_types_lookup["update_track"]:
        upd_track_metadata_digest = helpers.get_tx_arg(entry, "_multihashDigest").hex()
        upd_track_metadata_hash_fn = helpers.get_tx_arg(entry, "_multihashHashFn")
        update_buf = multihash.encode(
            bytes.fromhex(upd_track_metadata_digest), upd_track_metadata_hash_fn
        )
        upd_track_metadata_multihash = multihash.to_b58_string(update_buf)
        logger.info(
            f"index.py | tracks.py | update track metadata ipld : {upd_track_metadata_multihash}"
        )

        owner_id = helpers.get_tx_arg(entry, "_trackOwnerId")
        track_record.owner_id = owner_id
        track_record.is_delete = False

        handle = (
            session.query(User.handle)
            .filter(User.user_id == owner_id, User.is_current == True)
            .first()
        )[0]
        if not handle:
            raise EntityMissingRequiredFieldError(
                "track",
                track_record,
                f"No user found for {track_record}",
            )

        update_track_routes_table(
            session, track_record, track_metadata, pending_track_routes
        )
        track_record = populate_track_record_metadata(
            track_record, track_metadata, handle
        )
        track_record.metadata_multihash = upd_track_metadata_multihash

        # All incoming cover art is intended to be a directory
        # Any write to cover_art field is replaced by cover_art_sizes
        if track_record.cover_art:
            logger.info(
                f"index.py | tracks.py | Processing track cover art {track_record.cover_art}"
            )
            track_record.cover_art_sizes = track_record.cover_art
            track_record.cover_art = None

        update_remixes_table(session, track_record, track_metadata)

    if event_type == track_event_types_lookup["delete_track"]:
        track_record.is_delete = True
        track_record.stem_of = null()
        track_record.remix_of = null()
        track_record.premium_conditions = null()
        logger.info(f"index.py | tracks.py | Removing track : {track_record.track_id}")

    track_record.updated_at = block_datetime

    if not all_required_fields_present(Track, track_record):
        raise EntityMissingRequiredFieldError(
            "track",
            track_record,
            f"Error parsing track {track_record} with entity missing required field(s)",
        )

    return track_record


def dispatch_challenge_track_upload(
    bus: ChallengeEventBus, block_number: int, track_record
):
    bus.dispatch(ChallengeEvent.track_upload, block_number, track_record.owner_id)


def is_valid_json_field(metadata, field):
    if field in metadata and isinstance(metadata[field], dict) and metadata[field]:
        return True
    return False


def populate_track_record_metadata(track_record, track_metadata, handle):
    track_record.title = track_metadata["title"]
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
    return track_record
