import logging
from datetime import datetime
from sqlalchemy.orm.session import make_transient
from src.app import contract_addresses
from src.utils import helpers
from src.models import Playlist
from src.utils.playlist_event_constants import playlist_event_types_arr, playlist_event_types_lookup
from src.tasks.ipld_blacklist import is_blacklisted_ipld

logger = logging.getLogger(__name__)


def playlist_state_update(
        self, update_task, session, playlist_factory_txs, block_number, block_timestamp
):
    """Return int representing number of Playlist model state changes found in transaction."""
    num_total_changes = 0
    # This stores the playlist_ids created or updated in the set of transactions
    playlist_ids = set()

    if not playlist_factory_txs:
        return num_total_changes, playlist_ids

    playlist_abi = update_task.abi_values["PlaylistFactory"]["abi"]
    playlist_contract = update_task.web3.eth.contract(
        address=contract_addresses["playlist_factory"], abi=playlist_abi
    )

    playlist_events_lookup = {}
    for tx_receipt in playlist_factory_txs:
        txhash = update_task.web3.toHex(tx_receipt.transactionHash)
        for event_type in playlist_event_types_arr:
            playlist_events_tx = getattr(
                playlist_contract.events, event_type
            )().processReceipt(tx_receipt)
            processedEntries = 0 # if record does not get added, do not count towards num_total_changes
            for entry in playlist_events_tx:
                playlist_id = entry["args"]._playlistId
                playlist_ids.add(playlist_id)

                if playlist_id not in playlist_events_lookup:
                    existing_playlist_entry = lookup_playlist_record(
                        update_task, session, entry, block_number, txhash
                    )
                    playlist_events_lookup[playlist_id] = {
                        "playlist": existing_playlist_entry,
                        "events": [],
                    }

                playlist_record = parse_playlist_event(
                    self,
                    update_task,
                    entry,
                    event_type,
                    playlist_events_lookup[playlist_id]["playlist"],
                    block_timestamp,
                    session
                )

                if playlist_record is not None:
                    playlist_events_lookup[playlist_id]["events"].append(event_type)
                    playlist_events_lookup[playlist_id]["playlist"] = playlist_record
                    processedEntries += 1

            num_total_changes += processedEntries

    logger.info(f"index.py | playlists.py | There are {num_total_changes} events processed.")

    for playlist_id, value_obj in playlist_events_lookup.items():
        logger.info(f"index.py | playlists.py | Adding {value_obj['playlist']})")
        if value_obj["events"]:
            invalidate_old_playlist(session, playlist_id)
            session.add(value_obj["playlist"])

    return num_total_changes, playlist_ids


def lookup_playlist_record(update_task, session, entry, block_number, txhash):
    event_blockhash = update_task.web3.toHex(entry.blockHash)
    event_args = entry["args"]
    playlist_id = event_args._playlistId

    # Check if playlist record is in the DB
    playlist_exists = (
        session.query(Playlist).filter_by(playlist_id=event_args._playlistId).count()
        > 0
    )

    playlist_record = None
    if playlist_exists:
        playlist_record = (
            session.query(Playlist)
            .filter(Playlist.playlist_id == playlist_id, Playlist.is_current == True)
            .first()
        )

        # expunge the result from sqlalchemy so we can modify it without UPDATE statements being made
        # https://stackoverflow.com/questions/28871406/how-to-clone-a-sqlalchemy-db-object-with-new-primary-key
        session.expunge(playlist_record)
        make_transient(playlist_record)
    else:
        playlist_record = Playlist(
            playlist_id=playlist_id,
            is_current=True,
            is_delete=False
        )

    # update these fields regardless of type
    playlist_record.blocknumber = block_number
    playlist_record.blockhash = event_blockhash
    playlist_record.txhash = txhash

    return playlist_record


def invalidate_old_playlist(session, playlist_id):
    # check if playlist id is in db
    playlist_exists = (
        session.query(Playlist).filter_by(playlist_id=playlist_id).count() > 0
    )

    if playlist_exists:
        # Update existing record in db to is_current = False
        num_invalidated_playlists = (
            session.query(Playlist)
            .filter(Playlist.playlist_id == playlist_id, Playlist.is_current == True)
            .update({"is_current": False})
        )
        assert (
            num_invalidated_playlists > 0
        ), "Update operation requires a current playlist to be invalidated"


def parse_playlist_event(
        self, update_task, entry, event_type, playlist_record, block_timestamp, session
):
    event_args = entry["args"]
    # Just use block_timestamp as integer
    block_datetime = datetime.utcfromtimestamp(block_timestamp)
    block_integer_time = int(block_timestamp)

    if event_type == playlist_event_types_lookup["playlist_created"]:
        logger.info(f"index.py | playlists.py | Creating playlist {playlist_record.playlist_id}")
        playlist_record.playlist_owner_id = event_args._playlistOwnerId
        playlist_record.is_private = event_args._isPrivate
        playlist_record.is_album = event_args._isAlbum

        playlist_content_array = []
        for track_id in event_args._trackIds:
            playlist_content_array.append(
                {"track": track_id, "time": block_integer_time}
            )

        playlist_record.playlist_contents = {"track_ids": playlist_content_array}
        playlist_record.created_at = block_datetime

    if event_type == playlist_event_types_lookup["playlist_deleted"]:
        logger.info(f"index.py | playlists.py | Deleting playlist {playlist_record.playlist_id}")
        playlist_record.is_delete = True

    if event_type == playlist_event_types_lookup["playlist_track_added"]:
        if getattr(playlist_record, 'playlist_contents') is not None:
            logger.info(f"index.py | playlists.py | Adding track {event_args._addedTrackId} to playlist \
            {playlist_record.playlist_id}")
            old_playlist_content_array = playlist_record.playlist_contents["track_ids"]
            new_playlist_content_array = old_playlist_content_array
            # Append new track object
            new_playlist_content_array.append(
                {"track": event_args._addedTrackId, "time": block_integer_time}
            )
            playlist_record.playlist_contents = {"track_ids": new_playlist_content_array}
            playlist_record.timestamp = block_datetime

    if event_type == playlist_event_types_lookup["playlist_track_deleted"]:
        if getattr(playlist_record, 'playlist_contents') is not None:
            logger.info(f"index.py | playlists.py | Removing track {event_args._deletedTrackId} from \
            playlist {playlist_record.playlist_id}")
            old_playlist_content_array = playlist_record.playlist_contents["track_ids"]
            new_playlist_content_array = []
            deleted_track_id = event_args._deletedTrackId
            deleted_track_timestamp = int(event_args._deletedTrackTimestamp)
            delete_track_entry_found = False
            for track_entry in old_playlist_content_array:
                if track_entry["track"] == deleted_track_id \
                        and track_entry["time"] == deleted_track_timestamp \
                        and not delete_track_entry_found:
                    delete_track_entry_found = True
                    continue
                new_playlist_content_array.append(track_entry)

            playlist_record.playlist_contents = {"track_ids": new_playlist_content_array}

    if event_type == playlist_event_types_lookup["playlist_tracks_ordered"]:
        if getattr(playlist_record, 'playlist_contents') is not None:
            logger.info(f"index.py | playlists.py | Ordering playlist {playlist_record.playlist_id}")
            old_playlist_content_array = playlist_record.playlist_contents["track_ids"]

            intermediate_track_time_lookup_dict = {}

            for old_playlist_entry in old_playlist_content_array:
                track_id = old_playlist_entry["track"]
                track_time = old_playlist_entry["time"]

                if track_id not in intermediate_track_time_lookup_dict:
                    intermediate_track_time_lookup_dict[track_id] = []

                intermediate_track_time_lookup_dict[track_id].append(track_time)

            playlist_content_array = []
            for track_id in event_args._orderedTrackIds:
                if track_id in intermediate_track_time_lookup_dict:
                    track_time_array_length = len(intermediate_track_time_lookup_dict[track_id])
                    if track_time_array_length > 1:
                        track_time = intermediate_track_time_lookup_dict[track_id].pop(0)
                    elif track_time_array_length == 1:
                        track_time = intermediate_track_time_lookup_dict[track_id][0]
                    else:
                        track_time = block_integer_time
                else:
                    logger.info(
                        f"index.py | playlist.py | Track {track_id} not found, using track_time={block_integer_time}"
                    )
                    track_time = block_integer_time
                playlist_content_array.append({"track": track_id, "time": track_time})

            playlist_record.playlist_contents = {"track_ids": playlist_content_array}

    if event_type == playlist_event_types_lookup["playlist_name_updated"]:
        logger.info(f"index.py | playlists.py | Updating playlist {playlist_record.playlist_id} name \
        to {event_args._updatedPlaylistName}")
        playlist_record.playlist_name = event_args._updatedPlaylistName

    if event_type == playlist_event_types_lookup["playlist_privacy_updated"]:
        logger.info(f"index.py | playlists.py | Updating playlist {playlist_record.playlist_id} \
        privacy to {event_args._updatedIsPrivate}")
        playlist_record.is_private = event_args._updatedIsPrivate

    if event_type == playlist_event_types_lookup["playlist_cover_photo_updated"]:
        playlist_record.playlist_image_multihash = helpers.multihash_digest_to_cid(
            event_args._playlistImageMultihashDigest
        )

        # If cid is in blacklist, do not index playlist
        is_blacklisted = is_blacklisted_ipld(session, playlist_record.playlist_image_multihash)
        if is_blacklisted:
            logger.info(
                "index.py | playlists.py | Encountered blacklisted CID %s in indexing \
                playlist image multihash",
                playlist_record.playlist_image_multihash
            )
            return None

        # All incoming playlist images are set to ipfs dir in column playlist_image_sizes_multihash
        if playlist_record.playlist_image_multihash:
            logger.info(f"index.py | playlists.py | Processing playlist image \
            {playlist_record.playlist_image_multihash}")
            playlist_record.playlist_image_sizes_multihash = playlist_record.playlist_image_multihash
            playlist_record.playlist_image_multihash = None

    if event_type == playlist_event_types_lookup["playlist_description_updated"]:
        logger.info(f"index.py | playlists.py | Updating playlist {playlist_record.playlist_id} \
        description to {event_args._playlistDescription}")
        playlist_record.description = event_args._playlistDescription

    if event_type == playlist_event_types_lookup["playlist_upc_updated"]:
        logger.info(f"index.py | playlists.py | Updating playlist {playlist_record.playlist_id} UPC \
        to {event_args._playlistUPC}")
        playlist_record.upc = helpers.bytes32_to_str(event_args._playlistUPC)

    playlist_record.updated_at = block_datetime
    return playlist_record
