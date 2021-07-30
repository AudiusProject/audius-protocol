import logging
import time
import functools
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm.session import make_transient
from sqlalchemy.sql import null, functions
from src.app import contract_addresses
from src.utils import multihash, helpers
from src.models import Remix, Stem, Track, TrackRoute, User
from src.tasks.metadata import track_metadata_format
from src.tasks.ipld_blacklist import is_blacklisted_ipld
from src.utils.indexing_errors import IndexingError

logger = logging.getLogger(__name__)

track_event_types_lookup = {
    "new_track": "NewTrack",
    "update_track": "UpdateTrack",
    "delete_track": "TrackDeleted",
}

track_event_types_arr = [
    track_event_types_lookup["new_track"],
    track_event_types_lookup["update_track"],
    track_event_types_lookup["delete_track"],
]


def track_state_update(
    self,
    update_task,
    session,
    track_factory_txs,
    block_number,
    block_timestamp,
    block_hash,
):
    """Return int representing number of Track model state changes found in transaction."""
    num_total_changes = 0

    # This stores the track_ids created or updated in the set of transactions
    track_ids = set()

    if not track_factory_txs:
        return num_total_changes, track_ids

    track_abi = update_task.abi_values["TrackFactory"]["abi"]
    track_contract = update_task.web3.eth.contract(
        address=contract_addresses["track_factory"], abi=track_abi
    )
    pending_track_routes: List[TrackRoute] = []
    track_events = {}
    for tx_receipt in track_factory_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in track_event_types_arr:
            track_events_tx = getattr(
                track_contract.events, event_type
            )().processReceipt(tx_receipt)
            processedEntries = 0  # if record does not get added, do not count towards num_total_changes
            for entry in track_events_tx:
                event_args = entry["args"]
                track_id = (
                    event_args._trackId if "_trackId" in event_args else event_args._id
                )
                track_ids.add(track_id)
                blockhash = update_task.web3.toHex(entry.blockHash)

                if track_id not in track_events:
                    track_entry = lookup_track_record(
                        update_task,
                        session,
                        entry,
                        track_id,
                        block_number,
                        blockhash,
                        txhash,
                    )

                    track_events[track_id] = {"track": track_entry, "events": []}

                try:
                    parsed_track = parse_track_event(
                        self,
                        session,
                        update_task,
                        entry,
                        event_type,
                        track_events[track_id]["track"],
                        block_timestamp,
                        pending_track_routes,
                    )

                    # If track record object is None, it has a blacklisted metadata CID
                    if parsed_track is not None:
                        track_events[track_id]["events"].append(event_type)
                        track_events[track_id]["track"] = parsed_track
                        processedEntries += 1
                except Exception as e:
                    logger.info("Error in parse track transaction")
                    blockhash = update_task.web3.toHex(block_hash)
                    raise IndexingError(
                        "track", block_number, blockhash, txhash, str(e)
                    ) from e

            num_total_changes += processedEntries

    logger.info(
        f"index.py | tracks.py | [track indexing] There are {num_total_changes} events processed."
    )

    for track_id, value_obj in track_events.items():
        if value_obj["events"]:
            logger.info(f"index.py | tracks.py | Adding {value_obj['track']}")
            invalidate_old_track(session, track_id)
            session.add(value_obj["track"])

    return num_total_changes, track_ids


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


def update_stems_table(session, track_record, track_metadata):
    if (not "stem_of" in track_metadata) or (
        not isinstance(track_metadata["stem_of"], dict)
    ):
        return
    parent_track_id = track_metadata["stem_of"].get("parent_track_id")
    if not isinstance(parent_track_id, int):
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


def time_method(func):
    @functools.wraps(func)
    def wrapper(*args, **kargs):
        tick = time.perf_counter()
        func(*args, **kargs)
        tock = time.perf_counter()
        elapsed = tock - tick
        logger.info(f"TIME_METHOD Function={func.__name__} Elapsed={elapsed:0.6f}s")

    return wrapper


@time_method
def add_old_style_route(session, track_record, track_metadata, pending_track_routes):
    """Temporary method to add the old style routes to the track_routes db while we
    transition the clients to use the new routing API.
    """
    # Check if the title is staying the same, and if so, return early
    if track_record.title == track_metadata["title"]:
        return
    # Use create_track_route_id() since the regex replace is slightly different
    new_track_slug_title = helpers.create_track_route_id(track_metadata["title"], "")
    # Remove "/"
    new_track_slug_title = new_track_slug_title[1:]
    # Append ID
    new_track_slug_title = f"{new_track_slug_title}-{track_record.track_id}"

    # Check to make sure the route doesn't exist
    existing_track_route = next(
        (
            route
            for route in pending_track_routes
            if route.slug == new_track_slug_title
            and route.owner_id == track_record.owner_id
        ),
        None,
    )
    if existing_track_route is None:
        existing_track_route = (
            session.query(TrackRoute)
            .filter(
                TrackRoute.slug == new_track_slug_title,
                TrackRoute.owner_id == track_record.owner_id,
            )
            .one_or_none()
        )

    if existing_track_route is None:
        # Add the new track route
        new_track_route = TrackRoute()
        new_track_route.slug = new_track_slug_title
        new_track_route.title_slug = new_track_slug_title
        new_track_route.collision_id = 0
        new_track_route.owner_id = track_record.owner_id
        new_track_route.track_id = track_record.track_id
        new_track_route.is_current = (
            False  # This route is meant to be a fallback, not the main route
        )
        new_track_route.blockhash = track_record.blockhash
        new_track_route.blocknumber = track_record.blocknumber
        new_track_route.txhash = track_record.txhash
        session.add(new_track_route)

        # Add to in-memory store to make sure we don't try to add it twice
        pending_track_routes.append(new_track_route)
    else:
        logger.error(
            f"Cannot add 'old-style' track_route to Track={track_record}\
            as the route already exists: {existing_track_route}"
        )


@time_method
def update_track_routes_table(
    session, track_record, track_metadata, pending_track_routes
):
    """Creates the route for the given track and commits it to the track_routes table"""

    # Check if the title is staying the same, and if so, return early
    if track_record.title == track_metadata["title"]:
        return

    # Get the title slug, and set the new slug to that
    # (will check for conflicts later)
    new_track_slug_title = helpers.create_track_slug(track_metadata["title"], track_record.track_id)
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
    update_task,
    entry,
    event_type,
    track_record,
    block_timestamp,
    pending_track_routes,
):
    event_args = entry["args"]
    # Just use block_timestamp as integer
    block_datetime = datetime.utcfromtimestamp(block_timestamp)

    if event_type == track_event_types_lookup["new_track"]:
        track_record.created_at = block_datetime

        track_metadata_digest = event_args._multihashDigest.hex()
        track_metadata_hash_fn = event_args._multihashHashFn
        buf = multihash.encode(
            bytes.fromhex(track_metadata_digest), track_metadata_hash_fn
        )
        track_metadata_multihash = multihash.to_b58_string(buf)
        logger.info(
            f"index.py | tracks.py | track metadata ipld : {track_metadata_multihash}"
        )

        # If the IPLD is blacklisted, do not keep processing the current entry
        # continue with the next entry in the update_track_events list
        if is_blacklisted_ipld(session, track_metadata_multihash):
            logger.info(
                f"index.py | tracks.py | Encountered blacklisted metadata CID:"
                f"{track_metadata_multihash} in indexing new track"
            )
            return None

        owner_id = event_args._trackOwnerId
        track_record.owner_id = owner_id
        track_record.is_delete = False

        handle, creator_node_endpoint = (
            session.query(User.handle, User.creator_node_endpoint)
            .filter(User.user_id == owner_id, User.is_current == True)
            .first()
        )

        track_metadata = update_task.ipfs_client.get_metadata(
            track_metadata_multihash, track_metadata_format, creator_node_endpoint
        )

        add_old_style_route(session, track_record, track_metadata, pending_track_routes)
        update_track_routes_table(
            session, track_record, track_metadata, pending_track_routes
        )
        track_record = populate_track_record_metadata(
            track_record, track_metadata, handle
        )
        track_record.metadata_multihash = track_metadata_multihash

        # if cover_art CID is of a dir, store under _sizes field instead
        if track_record.cover_art:
            # If CID is in IPLD blacklist table, do not continue with indexing
            if is_blacklisted_ipld(session, track_record.cover_art):
                logger.info(
                    f"index.py | tracks.py | Encountered blacklisted cover art CID:"
                    f"{track_record.cover_art} in indexing new track"
                )
                return None

            logger.warning(
                f"index.py | tracks.py | Processing track cover art {track_record.cover_art}"
            )
            track_record.cover_art_sizes = track_record.cover_art
            track_record.cover_art = None

        update_stems_table(session, track_record, track_metadata)
        update_remixes_table(session, track_record, track_metadata)

    if event_type == track_event_types_lookup["update_track"]:
        upd_track_metadata_digest = event_args._multihashDigest.hex()
        upd_track_metadata_hash_fn = event_args._multihashHashFn
        update_buf = multihash.encode(
            bytes.fromhex(upd_track_metadata_digest), upd_track_metadata_hash_fn
        )
        upd_track_metadata_multihash = multihash.to_b58_string(update_buf)
        logger.info(
            f"index.py | tracks.py | update track metadata ipld : {upd_track_metadata_multihash}"
        )

        # If the IPLD is blacklisted, do not keep processing the current entry
        # continue with the next entry in the update_track_events list
        if is_blacklisted_ipld(session, upd_track_metadata_multihash):
            logger.info(
                f"index.py | tracks.py | Encountered blacklisted metadata CID:"
                f"{upd_track_metadata_multihash} in indexing update track"
            )
            return None

        owner_id = event_args._trackOwnerId
        track_record.owner_id = owner_id
        track_record.is_delete = False

        handle, creator_node_endpoint = (
            session.query(User.handle, User.creator_node_endpoint)
            .filter(User.user_id == owner_id, User.is_current == True)
            .first()
        )

        track_metadata = update_task.ipfs_client.get_metadata(
            upd_track_metadata_multihash, track_metadata_format, creator_node_endpoint
        )

        add_old_style_route(session, track_record, track_metadata, pending_track_routes)
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
            # If CID is in IPLD blacklist table, do not continue with indexing
            if is_blacklisted_ipld(session, track_record.cover_art):
                logger.info(
                    f"index.py | tracks.py | Encountered blacklisted cover art CID:"
                    f"{track_record.cover_art} in indexing update track"
                )
                return None

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
        logger.info(f"index.py | tracks.py | Removing track : {track_record.track_id}")

    track_record.updated_at = block_datetime

    return track_record


def is_valid_json_field(metadata, field):
    if field in metadata and isinstance(metadata[field], dict) and metadata[field]:
        return True
    return False


def populate_track_record_metadata(track_record, track_metadata, handle):
    track_record.title = track_metadata["title"]
    track_record.length = track_metadata["length"] or 0
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
