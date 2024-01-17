from integration_tests.utils import populate_mock_db
from src.gated_content.content_access_checker import ContentAccessChecker
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica


def test_access(app):
    with app.app_context():
        db = get_db_read_replica()

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
        tracks = [
            non_gated_track,
            stream_gated_track_1,
            stream_gated_track_2,
            stream_gated_track_3,
            download_gated_track_1,
            download_gated_track_2,
            stem_track_1,
            stem_track_2,
            stem_track_3,
        ]
        track_entities = []
        for track in tracks:
            track_entities.append(
                Track(
                    blockhash=hex(0),
                    blocknumber=0,
                    txhash=str(0),
                    track_id=track.get("track_id"),
                    owner_id=track.get("owner_id", 1),
                    is_stream_gated=track.get("is_stream_gated", False),
                    stream_conditions=track.get("stream_conditions", None),
                    is_download_gated=track.get("is_download_gated", False),
                    download_conditions=track.get("download_conditions", None),
                    stem_of=track.get("stem_of", None),
                    is_current=True,
                    is_delete=False,
                )
            )

        follows = [{"follower_user_id": 2, "followee_user_id": 1}]
        populate_mock_db(
            db,
            {
                "tracks": tracks,
                "follows": follows,
            },
        )

        content_access_checker = ContentAccessChecker()

        with db.scoped_session() as session:
            # test non-gated track
            result = content_access_checker.check_access(
                session=session,
                user_id=1,
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


def test_batch_access(app):
    with app.app_context():
        db = get_db_read_replica()

        non_exisent_track_id = 1
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
        user_1 = {"user_id": 1}
        user_2 = {"user_id": 2}
        user_3 = {"user_id": 3}
        users = [user_1, user_2, user_3]
        non_stream_gated_track = {
            "track_id": 2,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": False,
            "download_conditions": None,
        }
        stream_gated_track_1 = {
            "track_id": 3,
            "owner_id": user_3["user_id"],
            "is_stream_gated": True,
            "stream_conditions": collectible_gate,
            "is_download_gated": True,
            "download_conditions": collectible_gate,
        }
        stream_gated_track_2 = {
            **stream_gated_track_1,
            "track_id": 4,
        }
        stream_gated_track_3 = {
            "track_id": 5,
            "owner_id": 1,
            "is_stream_gated": True,
            "stream_conditions": follow_gate_1,
            "is_download_gated": True,
            "download_conditions": follow_gate_1,
        }
        download_gated_track_1 = {
            "track_id": 6,
            "owner_id": 3,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": True,
            "download_conditions": follow_gate_2,
        }
        download_gated_track_2 = {
            "track_id": 7,
            "owner_id": 1,
            "is_stream_gated": False,
            "stream_conditions": None,
            "is_download_gated": True,
            "download_conditions": follow_gate_1,
        }

        tracks = [
            non_stream_gated_track,
            stream_gated_track_1,
            stream_gated_track_2,
            stream_gated_track_3,
            download_gated_track_1,
            download_gated_track_2,
        ]
        follows = [{"follower_user_id": 2, "followee_user_id": 1}]
        populate_mock_db(
            db,
            {
                "users": users,
                "tracks": tracks,
                "follows": follows,
            },
        )

        content_access_checker = ContentAccessChecker()

        with db.scoped_session() as session:
            result = content_access_checker.check_access_for_batch(
                session,
                [
                    {
                        "user_id": user_1["user_id"],
                        "content_id": non_exisent_track_id,
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": non_stream_gated_track["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_2["user_id"],
                        "content_id": stream_gated_track_1["track_id"],
                        "content_type": "track",
                    },
                    {
                        "user_id": user_3["user_id"],
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
                ],
            )

            track_access_result = result["track"]

            # test non-existent track
            assert user_1["user_id"] not in track_access_result

            # test non-gated track
            user_2_non_stream_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][non_stream_gated_track["track_id"]]
            assert user_2_non_stream_gated_track_access_result["has_stream_access"]
            assert user_2_non_stream_gated_track_access_result["has_download_access"]

            # test stream gated track with user who has no access
            user_2_stream_gated_track_access_result = track_access_result[
                user_2["user_id"]
            ][stream_gated_track_1["track_id"]]
            assert not user_2_stream_gated_track_access_result["has_stream_access"]
            assert not user_2_stream_gated_track_access_result["has_download_access"]

            # test stream gated track with user who owns the track
            user_3_stream_gated_track_access_result = track_access_result[
                user_3["user_id"]
            ][stream_gated_track_2["track_id"]]
            assert user_3_stream_gated_track_access_result["has_stream_access"]
            assert user_3_stream_gated_track_access_result["has_download_access"]

            # test stream gated track with user who has access
            user_2_stream_gated_track_access_result_2 = track_access_result[
                user_2["user_id"]
            ][stream_gated_track_3["track_id"]]
            assert user_2_stream_gated_track_access_result_2["has_stream_access"]
            assert user_2_stream_gated_track_access_result_2["has_download_access"]

            # test download gated track with user who has no access
            user_2_download_gated_track_access_result_1 = track_access_result[
                user_2["user_id"]
            ][download_gated_track_1["track_id"]]
            assert user_2_download_gated_track_access_result_1["has_stream_access"]
            assert not user_2_download_gated_track_access_result_1[
                "has_download_access"
            ]

            # test download gated track with user who has access
            user_2_download_gated_track_access_result_2 = track_access_result[
                user_2["user_id"]
            ][download_gated_track_2["track_id"]]
            assert user_2_download_gated_track_access_result_2["has_stream_access"]
            assert user_2_download_gated_track_access_result_2["has_download_access"]
