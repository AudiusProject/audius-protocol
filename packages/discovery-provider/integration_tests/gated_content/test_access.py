from datetime import datetime, timezone
from typing import Any, Dict, List

from integration_tests.utils import populate_mock_db
from src.gated_content.content_access_checker import ContentAccessChecker
from src.models.playlists.playlist import Playlist
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica

# Data for tests
collectible_gate = {
    "nft_collection": {
        "chain": "eth",
        "standard": "ERC721",
        "address": "some-nft-collection-address",
        "name": "some nft collection name",
        "slug": "some-nft-collection",
        "imageUrl": "some-nft-collection-image-url",
        "externalLink": "some-nft-collection-external-link",
    }
}
follow_gate_1 = {"follow_user_id": 1}
follow_gate_2 = {"follow_user_id": 3}
usdc_gate_1 = {
    "usdc_purchase": {
        "price": 100,
        "splits": {"7gfRGGdp89N9g3mCsZjaGmDDRdcTnZh9u3vYyBab2tRy": 1000000},
    }
}
non_gated_track = {
    "track_id": 1,
    "owner_id": 3,
    "is_stream_gated": False,
    "stream_conditions": None,
    "is_download_gated": False,
    "download_conditions": None,
}
stream_gated_track_1 = {
    "track_id": 2,
    "owner_id": 3,
    "is_stream_gated": True,
    "stream_conditions": collectible_gate,
    "is_download_gated": True,
    "download_conditions": collectible_gate,
}
stream_gated_track_2 = {
    **stream_gated_track_1,
    "track_id": 3,
    "owner_id": 2,
}
stream_gated_track_3 = {
    "track_id": 4,
    "owner_id": 1,
    "is_stream_gated": True,
    "stream_conditions": follow_gate_1,
    "is_download_gated": True,
    "download_conditions": follow_gate_1,
}
download_gated_track_1 = {
    "track_id": 5,
    "owner_id": 3,
    "is_stream_gated": False,
    "stream_conditions": None,
    "is_download_gated": True,
    "download_conditions": follow_gate_2,
}
download_gated_track_2 = {
    "track_id": 6,
    "owner_id": 1,
    "is_stream_gated": False,
    "stream_conditions": None,
    "is_download_gated": True,
    "download_conditions": follow_gate_1,
}
stem_track_1 = {
    "track_id": 7,
    "owner_id": 1,
    "stem_of": {"category": "SAMPLE", "parent_track_id": 1},
}
stem_track_2 = {
    "track_id": 8,
    "owner_id": 1,
    "stem_of": {"category": "SAMPLE", "parent_track_id": 2},
}
stem_track_3 = {
    "track_id": 9,
    "owner_id": 1,
    "stem_of": {"category": "SAMPLE", "parent_track_id": 4},
}
usdc_stream_gated_track = {
    "track_id": 10,
    "owner_id": 1,
    "is_stream_gated": True,
    "stream_conditions": usdc_gate_1,
    "is_download_gated": True,
    "download_conditions": usdc_gate_1,
    "playlists_containing_track": [1],
}
usdc_download_gated_track = {
    "track_id": 11,
    "owner_id": 1,
    "is_stream_gated": False,
    "stream_conditions": None,
    "is_download_gated": True,
    "download_conditions": usdc_gate_1,
    "playlists_containing_track": [1],
}
usdc_stream_gated_track_previously_purchased_album = {
    "track_id": 12,
    "owner_id": 2,
    "is_stream_gated": True,
    "stream_conditions": usdc_gate_1,
    "is_download_gated": True,
    "download_conditions": usdc_gate_1,
    "playlists_previously_containing_track": {"2": {"time": 1711485199}},
}
tracks: List[Dict[str, Any]] = [
    non_gated_track,
    stream_gated_track_1,
    stream_gated_track_2,
    stream_gated_track_3,
    download_gated_track_1,
    download_gated_track_2,
    stem_track_1,
    stem_track_2,
    stem_track_3,
    usdc_stream_gated_track,
    usdc_download_gated_track,  # 10
    usdc_stream_gated_track_previously_purchased_album,
]
track_entities = []
for track in tracks:
    track_entities.append(
        Track(
            blockhash=hex(0),
            blocknumber=0,
            txhash=str(0),
            track_id=track.get("track_id", 0),
            owner_id=track.get("owner_id", 1),
            stream_conditions=track.get("stream_conditions", None),
            download_conditions=track.get("download_conditions", None),
            stem_of=track.get("stem_of", None),
            playlists_containing_track=track.get("playlists_containing_track", []),
            is_current=True,
            is_delete=False,
        )
    )
playlists: List[Dict[str, Any]] = [
    {
        "playlist_id": 1,
        "playlist_owner_id": 1,
        "is_album": True,
        "is_private": False,
        "playlist_name": "premium album",
        "playlist_contents": {
            "tracks": [
                {"track": 10, "time": 0},
                {"track": 11, "time": 0},
            ]
        },
    },
    {
        "playlist_id": 2,
        "playlist_owner_id": 1,
        "is_album": True,
        "is_private": False,
        "playlist_name": "premium album",
        "playlist_contents": {
            "tracks": [
                {"track": 10, "time": 0},
                {"track": 11, "time": 0},
            ]
        },
        "is_stream_gated": True,
        "stream_conditions": usdc_gate_1,
    },
    {
        "playlist_id": 3,
        "playlist_owner_id": 1,
        "is_album": True,
        "is_private": False,
        "playlist_name": "premium album that removed track 12",
        "playlist_contents": {
            "tracks": [
                {"track": 10, "time": 0},
                {"track": 11, "time": 0},
            ]
        },
        "is_stream_gated": True,
        "stream_conditions": usdc_gate_1,
    },
]
playlist_entities = []
for playlist in playlists:
    playlist_entities.append(
        Playlist(
            blockhash=hex(0),
            blocknumber=0,
            txhash=str(0),
            playlist_id=playlist.get("playlist_id", 0),
            playlist_owner_id=playlist.get("playlist_owner_id", 1),
            is_stream_gated=playlist.get("is_stream_gated", False),
            stream_conditions=playlist.get("stream_conditions", None),
            is_current=True,
            is_delete=False,
        )
    )

follows = [{"follower_user_id": 2, "followee_user_id": 1}]
usdc_purchases = [
    {"buyer_user_id": 2, "content_id": 10, "content_type": "track"},
    {"buyer_user_id": 2, "content_id": 11, "content_type": "track"},
    {"buyer_user_id": 4, "content_id": 1, "content_type": "album"},
    {
        "buyer_user_id": 3,
        "content_id": 2,
        "content_type": "album",
        "created_at": datetime.fromtimestamp(1711485198, timezone.utc),
    },
    {
        "buyer_user_id": 5,
        "content_id": 2,
        "content_type": "album",
        "created_at": datetime.fromtimestamp(1711485200, timezone.utc),
    },
    {
        "buyer_user_id": 6,
        "content_id": usdc_stream_gated_track["track_id"],
        "content_type": "track",
        "created_at": datetime.fromtimestamp(1711485200, timezone.utc),
    },
]
user_1 = {"user_id": 1}
user_2 = {"user_id": 2}
user_3 = {"user_id": 3}
user_4 = {"user_id": 4}
user_5 = {"user_id": 5}
user_6 = {"user_id": 6}
users = [user_1, user_2, user_3, user_4, user_5, user_6]


def setup_db(app):
    with app.app_context():
        db = get_db_read_replica()

        populate_mock_db(
            db,
            {
                "tracks": tracks,
                "follows": follows,
                "usdc_purchases": usdc_purchases,
                "playlists": playlists,
                "users": users,
            },
        )

    return db


def test_access(app):
    db = setup_db(app)
    content_access_checker = ContentAccessChecker()
    with app.app_context():
        with db.scoped_session() as session:
            # test non-gated track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[0],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test stream gated track with user who has no access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[1],
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]

            # test stream gated track with user who owns the track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[2],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test stream gated track with user who has access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[3],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test download gated track with user who has no access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[4],
            )
            assert result["has_stream_access"]
            assert not result["has_download_access"]

            # test download gated track with user who has access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[5],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test stem access for non-gated parent track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[6],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test stem access for gated parent track with user who has no access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[7],
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]

            # test stem access for gated parent track with user who has access
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[8],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated track with track owner
            result = content_access_checker.check_access(
                session=session,
                user_id=1,
                content_type="track",
                content_entity=track_entities[9],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated track with user who has purchased the track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[9],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated track with user who has not purchased the track
            result = content_access_checker.check_access(
                session=session,
                user_id=3,
                content_type="track",
                content_entity=track_entities[9],
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]

            # test usdc download-gated track with track owner
            result = content_access_checker.check_access(
                session=session,
                user_id=1,
                content_type="track",
                content_entity=track_entities[10],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc download-gated track with user who has purchased the track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=track_entities[10],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc download-gated track with user who has not purchased the track
            # (track is free-to-stream)
            result = content_access_checker.check_access(
                session=session,
                user_id=3,
                content_type="track",
                content_entity=track_entities[10],
            )
            assert result["has_stream_access"]
            assert not result["has_download_access"]

            # test usdc stream-gated track with user who purchased album including track
            result = content_access_checker.check_access(
                session=session,
                user_id=4,
                content_type="track",
                content_entity=track_entities[9],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc download-gated track with user who purchased album including track
            # (purchasing album does not grant download access if track is download-gated-only)
            result = content_access_checker.check_access(
                session=session,
                user_id=4,
                content_type="track",
                content_entity=track_entities[10],
            )
            assert result["has_stream_access"]
            assert not result["has_download_access"]

            # test usdc stream-gated track with user who purchased album that previously contained track
            # and the purchase occurred before the track was removed from the album
            result = content_access_checker.check_access(
                session=session,
                user_id=3,
                content_type="track",
                content_entity=track_entities[11],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated track with user who purchased album that previously contained track
            # but the purchase occurred after the track was removed from the album
            result = content_access_checker.check_access(
                session=session,
                user_id=5,
                content_type="track",
                content_entity=track_entities[11],
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]

            # test non-gated album with owner
            result = content_access_checker.check_access(
                session=session,
                user_id=1,
                content_type="album",
                content_entity=playlist_entities[0],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test non-gated album with non-owner
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="album",
                content_entity=playlist_entities[0],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated album with owner
            result = content_access_checker.check_access(
                session=session,
                user_id=1,
                content_type="album",
                content_entity=playlist_entities[1],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated album with user who purchased album
            result = content_access_checker.check_access(
                session=session,
                user_id=3,
                content_type="album",
                content_entity=playlist_entities[1],
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # test usdc stream-gated album with user who did not purchase album
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="album",
                content_entity=playlist_entities[1],
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]


def test_batch_access(app):
    db = setup_db(app)
    content_access_checker = ContentAccessChecker()
    with app.app_context():
        with db.scoped_session() as session:
            result = content_access_checker.check_access_for_batch(
                session,
                [
                    {
                        "user_id": user_6["user_id"],
                        "content_id": 100,  # non-existent track
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": non_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stream_gated_track_1["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stream_gated_track_2["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stream_gated_track_3["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": download_gated_track_1["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": download_gated_track_2["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stem_track_1["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stem_track_2["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stem_track_3["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_1["user_id"],
                        "content_id": usdc_stream_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": usdc_stream_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_3["user_id"],
                        "content_id": usdc_stream_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_1["user_id"],
                        "content_id": usdc_download_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": usdc_download_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_3["user_id"],
                        "content_id": usdc_download_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_4["user_id"],
                        "content_id": usdc_stream_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_4["user_id"],
                        "content_id": usdc_download_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_3["user_id"],
                        "content_id": usdc_stream_gated_track_previously_purchased_album[
                            "track_id"
                        ],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_5["user_id"],
                        "content_id": usdc_stream_gated_track_previously_purchased_album[
                            "track_id"
                        ],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_1["user_id"],
                        "content_id": playlists[0]["playlist_id"],
                        "content_type": "album",
                    },
                    {
                        "user_id": user_3["user_id"],
                        "content_id": playlists[0]["playlist_id"],
                        "content_type": "album",
                    },
                    {
                        "user_id": user_1["user_id"],
                        "content_id": playlists[1]["playlist_id"],
                        "content_type": "album",
                    },
                    {
                        "user_id": user_3["user_id"],
                        "content_id": playlists[1]["playlist_id"],
                        "content_type": "album",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": playlists[1]["playlist_id"],
                        "content_type": "album",
                    },
                ],
            )

            track_access_result = result["track"]

            # test non-existent track
            assert user_6["user_id"] not in track_access_result

            # test non-gated track
            user_2_non_stream_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][non_gated_track["track_id"]]
            assert user_2_non_stream_gated_track_access_result["has_stream_access"]
            assert user_2_non_stream_gated_track_access_result["has_download_access"]

            # test stream gated track with user who has no access
            user_2_stream_gated_track_no_access_result = track_access_result[
                user_2["user_id"]
            ][stream_gated_track_1["track_id"]]
            assert not user_2_stream_gated_track_no_access_result["has_stream_access"]
            assert not user_2_stream_gated_track_no_access_result["has_download_access"]

            # test stream gated track with user who owns the track
            user_2_stream_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][stream_gated_track_2["track_id"]]
            assert user_2_stream_gated_track_access_result["has_stream_access"]
            assert user_2_stream_gated_track_access_result["has_download_access"]

            # test stream gated track with user who has access
            user_2_stream_gated_track_no_access_result = track_access_result[
                user_2["user_id"]
            ][stream_gated_track_3["track_id"]]
            assert user_2_stream_gated_track_no_access_result["has_stream_access"]
            assert user_2_stream_gated_track_no_access_result["has_download_access"]

            # test download gated track with user who has no access
            user_2_download_gated_track_no_access_result = track_access_result[
                user_2["user_id"]
            ][download_gated_track_1["track_id"]]
            assert user_2_download_gated_track_no_access_result["has_stream_access"]
            assert not user_2_download_gated_track_no_access_result[
                "has_download_access"
            ]

            # test download gated track with user who has access
            user_2_download_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][download_gated_track_2["track_id"]]
            assert user_2_download_gated_track_access_result["has_stream_access"]
            assert user_2_download_gated_track_access_result["has_download_access"]

            # test stem access for non-gated parent track
            user_2_stem_parent_non_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][stem_track_1["track_id"]]
            assert user_2_stem_parent_non_gated_track_access_result["has_stream_access"]
            assert user_2_stem_parent_non_gated_track_access_result[
                "has_download_access"
            ]

            # test stem access for gated parent track with user who has no access
            user_2_stem_parent_gated_track_no_access_result = track_access_result[
                user_2["user_id"]
            ][stem_track_2["track_id"]]
            assert user_2_stem_parent_gated_track_no_access_result["has_stream_access"]
            assert user_2_stem_parent_gated_track_no_access_result[
                "has_download_access"
            ]

            # test stem access for gated parent track with user who has access
            user_2_stem_parent_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][stem_track_3["track_id"]]
            assert user_2_stem_parent_gated_track_access_result["has_stream_access"]
            assert user_2_stem_parent_gated_track_access_result["has_download_access"]

            # test usdc stream-gated track with track owner
            user_1_usdc_stream_gated_track_access_result = track_access_result[
                user_1["user_id"]
            ][usdc_stream_gated_track["track_id"]]
            assert user_1_usdc_stream_gated_track_access_result["has_stream_access"]
            assert user_1_usdc_stream_gated_track_access_result["has_download_access"]

            # test usdc_stream_gated_track stream-gated track with user who has purchased the track
            user_2_usdc_stream_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][usdc_stream_gated_track["track_id"]]
            assert user_2_usdc_stream_gated_track_access_result["has_stream_access"]
            assert user_2_usdc_stream_gated_track_access_result["has_download_access"]

            # test usdc_stream_gated_track stream-gated track with user who has not purchased the track
            user_3_usdc_stream_gated_track_access_result = track_access_result[
                user_3["user_id"]
            ][usdc_stream_gated_track["track_id"]]
            assert not user_3_usdc_stream_gated_track_access_result["has_stream_access"]
            assert not user_3_usdc_stream_gated_track_access_result[
                "has_download_access"
            ]

            # test usdc download-gated track with track owner
            user_1_usdc_download_gated_track_access_result = track_access_result[
                user_1["user_id"]
            ][usdc_download_gated_track["track_id"]]
            assert user_1_usdc_download_gated_track_access_result["has_stream_access"]
            assert user_1_usdc_download_gated_track_access_result["has_download_access"]

            # test usdc download-gated track with user who has purchased the track
            user_2_usdc_download_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][usdc_download_gated_track["track_id"]]
            assert user_2_usdc_download_gated_track_access_result["has_stream_access"]
            assert user_2_usdc_download_gated_track_access_result["has_download_access"]

            # test usdc download-gated track with user who has not purchased the track
            # (track is free-to-stream)
            user_3_usdc_download_gated_track_access_result = track_access_result[
                user_3["user_id"]
            ][usdc_download_gated_track["track_id"]]
            assert user_3_usdc_download_gated_track_access_result["has_stream_access"]
            assert not user_3_usdc_download_gated_track_access_result[
                "has_download_access"
            ]

            # test usdc stream-gated track with user who purchased album including track
            user_4_usdc_stream_gated_track_access_result = track_access_result[
                user_4["user_id"]
            ][usdc_stream_gated_track["track_id"]]
            assert user_4_usdc_stream_gated_track_access_result["has_stream_access"]
            assert user_4_usdc_stream_gated_track_access_result["has_download_access"]

            # test usdc download-gated track with user who purchased album including track
            # (purchasing album does not grant download access if track is download-gated-only)
            user_4_usdc_download_gated_track_access_result = track_access_result[
                user_4["user_id"]
            ][usdc_download_gated_track["track_id"]]
            assert user_4_usdc_download_gated_track_access_result["has_stream_access"]
            assert not user_4_usdc_download_gated_track_access_result[
                "has_download_access"
            ]

            # test usdc stream-gated track with user who purchased album that previously contained track
            # and the purchase occurred before the track was removed from the album
            user_3_usdc_stream_gated_track_previously_in_album_access_result = (
                track_access_result[user_3["user_id"]][
                    usdc_stream_gated_track_previously_purchased_album["track_id"]
                ]
            )
            assert user_3_usdc_stream_gated_track_previously_in_album_access_result[
                "has_stream_access"
            ]
            assert user_3_usdc_stream_gated_track_previously_in_album_access_result[
                "has_download_access"
            ]

            # test usdc stream-gated track with user who purchased album that previously contained track
            # but the purchase occurred after the track was removed from the album
            user_5_usdc_stream_gated_track_previously_in_album_access_result = (
                track_access_result[user_5["user_id"]][
                    usdc_stream_gated_track_previously_purchased_album["track_id"]
                ]
            )
            assert not user_5_usdc_stream_gated_track_previously_in_album_access_result[
                "has_stream_access"
            ]
            assert not user_5_usdc_stream_gated_track_previously_in_album_access_result[
                "has_download_access"
            ]

            album_access_result = result["album"]

            # test non-gated album with owner
            user_1_album_access_result = album_access_result[user_1["user_id"]][
                playlists[0]["playlist_id"]
            ]
            assert user_1_album_access_result["has_stream_access"]
            assert user_1_album_access_result["has_download_access"]

            # test non-gated album with non-owner
            user_3_album_access_result = album_access_result[user_3["user_id"]][
                playlists[0]["playlist_id"]
            ]
            assert user_3_album_access_result["has_stream_access"]
            assert user_3_album_access_result["has_download_access"]

            # test usdc stream-gated album with owner
            user_1_usdc_stream_gated_album_access_result = album_access_result[
                user_1["user_id"]
            ][playlists[1]["playlist_id"]]
            assert user_1_usdc_stream_gated_album_access_result["has_stream_access"]
            assert user_1_usdc_stream_gated_album_access_result["has_download_access"]

            # test usdc stream-gated album with user who purchased album
            user_3_usdc_stream_gated_album_access_result = album_access_result[
                user_3["user_id"]
            ][playlists[1]["playlist_id"]]
            assert user_3_usdc_stream_gated_album_access_result["has_stream_access"]
            assert user_3_usdc_stream_gated_album_access_result["has_download_access"]

            # test usdc stream-gated album with user who did not purchase album
            user_2_usdc_stream_gated_album_access_result = album_access_result[
                user_2["user_id"]
            ][playlists[1]["playlist_id"]]
            assert not user_2_usdc_stream_gated_album_access_result["has_stream_access"]
            assert not user_2_usdc_stream_gated_album_access_result[
                "has_download_access"
            ]


def test_access_conditions_update(app):
    db = setup_db(app)
    content_access_checker = ContentAccessChecker()
    with app.app_context():
        with db.scoped_session() as session:
            # PURCHASE GATED TO FOLLOW GATED
            # update stream gated track to be follow gated
            new_access_conditions = {
                "follow_user_id": usdc_stream_gated_track["owner_id"]
            }
            session.query(Track).filter(
                Track.track_id == usdc_stream_gated_track["track_id"]
            ).update(
                {
                    "stream_conditions": new_access_conditions,
                    "download_conditions": new_access_conditions,
                }
            )

            # user 6 previously purchased the usdc stream gated track
            # now that the access conditions for that track has changed
            # to be follow gated, and that user 6 does not follow the track's owner,
            # test that user 6 still has access because of its past purchase.
            result = content_access_checker.check_access(
                session=session,
                user_id=6,
                content_type="track",
                content_entity=(
                    session.query(Track)
                    .filter(Track.track_id == usdc_stream_gated_track["track_id"])
                    .first()
                ),
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # FOLLOW GATED TO TIP GATED
            # user 2 currently has access to the following follow-gated track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=(
                    session.query(Track)
                    .filter(Track.track_id == stream_gated_track_3["track_id"])
                    .first()
                ),
            )
            assert result["has_stream_access"]
            assert result["has_download_access"]

            # update track to be tip gated
            new_access_conditions = {"tip_user_id": stream_gated_track_3["owner_id"]}
            session.query(Track).filter(
                Track.track_id == stream_gated_track_3["track_id"]
            ).update(
                {
                    "stream_conditions": new_access_conditions,
                    "download_conditions": new_access_conditions,
                }
            )

            # user 2 should no longer have access to the track
            result = content_access_checker.check_access(
                session=session,
                user_id=2,
                content_type="track",
                content_entity=(
                    session.query(Track)
                    .filter(Track.track_id == stream_gated_track_3["track_id"])
                    .first()
                ),
            )
            assert not result["has_stream_access"]
            assert not result["has_download_access"]
