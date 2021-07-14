import random
from datetime import datetime
from src.tasks.playlists import parse_playlist_event, lookup_playlist_record
from src.utils.db_session import get_db
from src.utils.playlist_event_constants import playlist_event_types_lookup
from src.utils import helpers
from tests.index_helpers import AttrDict, IPFSClient, Web3, UpdateTask

# event_type: PlaylistCreated
def get_playlist_created_event():
    event_type = playlist_event_types_lookup["playlist_created"]
    playlist_created_event = AttrDict(
        {
            "_playlistId": 1,
            "_playlistOwnerId": 1,
            "_isPrivate": True,
            "_isAlbum": False,
            "_trackIds": [],  # This is a list of numbers (track ids)
        }
    )
    return event_type, AttrDict({"blockHash": "0x", "args": playlist_created_event})


# event_type: PlaylistNameUpdated
def get_playlist_name_updated_event():
    event_type = playlist_event_types_lookup["playlist_name_updated"]
    playlist_name_updated_event = AttrDict(
        {"_playlistId": 1, "_updatedPlaylistName": "asdfg"}
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_name_updated_event}
    )


# event_type: PlaylistCoverPhotoUpdated
def get_playlist_cover_photo_updated_event():
    event_type = playlist_event_types_lookup["playlist_cover_photo_updated"]
    playlist_cover_photo_updated_event = AttrDict(
        {
            "_playlistId": 1,
            "_playlistImageMultihashDigest": b"\xad\x8d\x1eeG\xf2\x12\xe3\x817"
            + b"\x7f\xb1A\xc6 M~\xfe\x03F\x98f\xab\xfa3\x17ib\xdcC>\xed",
        }
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_cover_photo_updated_event}
    )


# event_type: PlaylistDescriptionUpdated
def get_playlist_description_updated_event():
    event_type = playlist_event_types_lookup["playlist_description_updated"]
    playlist_description_updated_event = AttrDict(
        {"_playlistId": 1, "_playlistDescription": "adf"}
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_description_updated_event}
    )


# event_type: PlaylistTrackAdded
def get_playlist_track_added_event(playlistId, addedTrackId):
    event_type = playlist_event_types_lookup["playlist_track_added"]
    playlist_track_added_event = AttrDict(
        {"_playlistId": playlistId, "_addedTrackId": addedTrackId}
    )
    return event_type, AttrDict({"blockHash": "0x", "args": playlist_track_added_event})


# event_type: PlaylistTracksOrdered
def get_playlist_tracks_ordered_event():
    event_type = playlist_event_types_lookup["playlist_tracks_ordered"]
    playlist_tracks_ordered_event = AttrDict(
        {"_playlistId": 1, "_orderedTrackIds": [2, 1]}
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_tracks_ordered_event}
    )


# event_type: PlaylistTrackDeleted
def get_playlist_track_delete_event(playlistId, deletedTrackId, deletedTrackTimestamp):
    event_type = playlist_event_types_lookup["playlist_track_deleted"]
    playlist_track_delete_event = AttrDict(
        {
            "_playlistId": playlistId,
            "_deletedTrackId": deletedTrackId,
            "_deletedTrackTimestamp": deletedTrackTimestamp,
        }
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_track_delete_event}
    )

    # event_type: PlaylistPrivacyUpdated


def get_playlist_privacy_updated_event():
    event_type = playlist_event_types_lookup["playlist_privacy_updated"]
    playlist_privacy_updated_event = AttrDict(
        {"_playlistId": 1, "_updatedIsPrivate": False}
    )
    return event_type, AttrDict(
        {"blockHash": "0x", "args": playlist_privacy_updated_event}
    )


# event_type: PlaylistDeleted
def get_playlist_deleted_event():
    event_type = playlist_event_types_lookup["playlist_deleted"]
    playlist_deleted_event = AttrDict({"_playlistId": 1})
    return event_type, AttrDict({"blockHash": "0x", "args": playlist_deleted_event})


def test_index_playlist(app):
    """Tests that playlists are indexed correctly"""
    with app.app_context():
        db = get_db()

    ipfs_client = IPFSClient({})
    web3 = Web3()
    update_task = UpdateTask(ipfs_client, web3)

    with db.scoped_session() as session:
        # ================= Test playlist_created Event =================
        event_type, entry = get_playlist_created_event()

        block_number = random.randint(1, 10000)
        block_timestamp = 1585336422

        # Some sqlalchemy playlist instance
        playlist_record = lookup_playlist_record(
            update_task, session, entry, block_number, "0x"  # txhash
        )

        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )

        assert playlist_record.playlist_owner_id == entry.args._playlistOwnerId
        assert playlist_record.is_private == entry.args._isPrivate
        assert playlist_record.is_album == entry.args._isAlbum
        block_datetime = datetime.utcfromtimestamp(block_timestamp)
        block_integer_time = int(block_timestamp)

        playlist_content_array = []
        for track_id in entry.args._trackIds:
            playlist_content_array.append(
                {"track": track_id, "time": block_integer_time}
            )

        assert playlist_record.playlist_contents == {
            "track_ids": playlist_content_array
        }
        assert playlist_record.created_at == block_datetime

        # ================= Test playlist_name_updated Event =================
        event_type, entry = get_playlist_name_updated_event()

        assert playlist_record.playlist_name == None
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )
        assert playlist_record.playlist_name == entry.args._updatedPlaylistName

        # ================= Test playlist_cover_photo_updated Event =================
        event_type, entry = get_playlist_cover_photo_updated_event()
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )
        assert playlist_record.playlist_image_sizes_multihash == (
            helpers.multihash_digest_to_cid(entry.args._playlistImageMultihashDigest)
        )
        assert playlist_record.playlist_image_multihash == None

        # ================= Test playlist_description_updated Event =================
        event_type, entry = get_playlist_description_updated_event()
        assert playlist_record.description == None
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )
        assert playlist_record.description == entry.args._playlistDescription

        # ================= Test playlist_privacy_updated Event =================
        event_type, entry = get_playlist_privacy_updated_event()
        assert playlist_record.is_private == True
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )
        assert playlist_record.is_private == entry.args._updatedIsPrivate

        # ================= Test playlist_track_added Event =================
        event_type, entry = get_playlist_track_added_event(1, 1)

        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            12,  # block_timestamp,
            session,
        )

        assert len(playlist_record.playlist_contents["track_ids"]) == 1
        last_playlist_content = playlist_record.playlist_contents["track_ids"][-1]
        assert last_playlist_content == {"track": entry.args._addedTrackId, "time": 12}

        # ================= Test playlist_track_added with second track Event =================
        event_type, entry = get_playlist_track_added_event(1, 2)

        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            13,  # block_timestamp,
            session,
        )

        assert len(playlist_record.playlist_contents["track_ids"]) == 2
        last_playlist_content = playlist_record.playlist_contents["track_ids"][-1]
        assert last_playlist_content == {"track": entry.args._addedTrackId, "time": 13}

        # ================= Test playlist_tracks_ordered Event =================
        event_type, entry = get_playlist_tracks_ordered_event()
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )

        assert playlist_record.playlist_contents["track_ids"] == [
            {"track": 2, "time": 13},
            {"track": 1, "time": 12},
        ]

        # ================= Test playlist_track_delete_event Event =================
        event_type, entry = get_playlist_track_delete_event(1, 1, 12)

        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )

        assert len(playlist_record.playlist_contents["track_ids"]) == 1
        last_playlist_content = playlist_record.playlist_contents["track_ids"][-1]
        assert playlist_record.playlist_contents["track_ids"] == [
            {"track": 2, "time": 13}
        ]

        # ================= Test playlist_track_delete_event Event =================
        # This should be a no-op
        event_type, entry = get_playlist_track_delete_event(1, 1, 12)

        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )

        assert len(playlist_record.playlist_contents["track_ids"]) == 1
        assert playlist_record.playlist_contents["track_ids"] == [
            {"track": 2, "time": 13}
        ]

        # ================= Test playlist_deleted Event =================
        event_type, entry = get_playlist_deleted_event()
        assert playlist_record.is_delete == False
        parse_playlist_event(
            None,  # self - not used
            None,  # update_task - not used
            entry,
            event_type,
            playlist_record,
            block_timestamp,
            session,
        )
        assert playlist_record.is_delete == True
