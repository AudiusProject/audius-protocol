from integration_tests.utils import populate_mock_db
from src.gated_content.gated_content_access_checker import GatedContentAccessChecker
from src.models.tracks.track import Track
from src.utils.db_session import get_db_read_replica


def test_access(app):
    with app.app_context():
        db = get_db_read_replica()
        non_premium_track_entity = {
            "track_id": 1,
            "owner_id": 3,
            "is_premium": False,
            "premium_conditions": None,
        }
        premium_track_entity_1 = {
            "track_id": 2,
            "owner_id": 3,
            "is_premium": True,
            "premium_conditions": {
                "nft_collection": {
                    "chain": "eth",
                    "standard": "ERC721",
                    "address": "some-nft-collection-address",
                    "name": "some nft collection name",
                    "slug": "some-nft-collection",
                    "imageUrl": "some-nft-collection-image-url",
                    "externalLink": "some-nft-collection-external-link",
                }
            },
        }
        premium_track_entity_2 = {
            "track_id": 3,
            "owner_id": 2,
            "is_premium": True,
            "premium_conditions": {
                "nft_collection": {
                    "chain": "eth",
                    "standard": "ERC721",
                    "address": "some-nft-collection-address",
                    "name": "some nft collection name",
                    "slug": "some-nft-collection",
                    "imageUrl": "some-nft-collection-image-url",
                    "externalLink": "some-nft-collection-external-link",
                }
            },
        }
        premium_track_entity_3 = {
            "track_id": 4,
            "owner_id": 1,
            "is_premium": True,
            "premium_conditions": {"follow_user_id": 1},
        }
        track_entities = [
            non_premium_track_entity,
            premium_track_entity_1,
            premium_track_entity_2,
            premium_track_entity_3,
        ]
        tracks = []
        for entity in track_entities:
            tracks.append(
                Track(
                    blockhash=hex(0),
                    blocknumber=0,
                    txhash=str(0),
                    track_id=entity.get("track_id"),
                    owner_id=entity.get("owner_id", 1),
                    is_premium=entity.get("is_premium", False),
                    premium_conditions=entity.get("premium_conditions", None),
                    is_current=True,
                    is_delete=False,
                )
            )

        populate_mock_db(
            db, {"follows": [{"follower_user_id": 2, "followee_user_id": 1}]}
        )

        gated_content_access_checker = GatedContentAccessChecker()

        # test non-gated content
        with db.scoped_session() as session:
            result = gated_content_access_checker.check_access(
                session=session,
                user_id=1,
                premium_content_id=non_premium_track_entity["track_id"],
                premium_content_type="track",
                premium_content_entity=tracks[0],
            )
            assert not result["is_premium"] and result["does_user_have_access"]

            # test gated content with user who has no access
            result = gated_content_access_checker.check_access(
                session=session,
                user_id=2,
                premium_content_id=premium_track_entity_1["track_id"],
                premium_content_type="track",
                premium_content_entity=tracks[1],
            )
            assert result["is_premium"] and not result["does_user_have_access"]

            # test gated content with user who owns the track
            result = gated_content_access_checker.check_access(
                session=session,
                user_id=2,
                premium_content_id=premium_track_entity_2["track_id"],
                premium_content_type="track",
                premium_content_entity=tracks[2],
            )
            assert result["is_premium"] and result["does_user_have_access"]

            # test gated content with user who has access
            result = gated_content_access_checker.check_access(
                session=session,
                user_id=2,
                premium_content_id=premium_track_entity_3["track_id"],
                premium_content_type="track",
                premium_content_entity=tracks[3],
            )
            assert result["is_premium"] and result["does_user_have_access"]


def test_batch_access(app):
    with app.app_context():
        db = get_db_read_replica()

        user_entity_1 = {"user_id": 1}
        user_entity_2 = {"user_id": 2}
        user_entity_3 = {"user_id": 3}
        user_entities = [user_entity_1, user_entity_2, user_entity_3]

        non_exisent_track_id = 1

        non_premium_track_entity = {
            "track_id": 2,
            "is_premium": False,
            "premium_conditions": None,
        }
        premium_track_entity_1 = {
            "track_id": 3,
            "is_premium": True,
            "premium_conditions": {
                "nft_collection": {
                    "chain": "eth",
                    "standard": "ERC721",
                    "address": "some-nft-collection-address",
                    "name": "some nft collection name",
                    "slug": "some-nft-collection",
                    "imageUrl": "some-nft-collection-image-url",
                    "externalLink": "some-nft-collection-external-link",
                }
            },
        }
        premium_track_entity_2 = {
            "track_id": 4,
            "owner_id": user_entity_3["user_id"],
            "is_premium": True,
            "premium_conditions": {
                "nft_collection": {
                    "chain": "eth",
                    "standard": "ERC721",
                    "address": "some-nft-collection-address",
                    "name": "some nft collection name",
                    "slug": "some-nft-collection",
                    "imageUrl": "some-nft-collection-image-url",
                    "externalLink": "some-nft-collection-external-link",
                }
            },
        }
        premium_track_entity_3 = {
            "track_id": 5,
            "owner_id": 1,
            "is_premium": True,
            "premium_conditions": {"follow_user_id": 1},
        }
        track_entities = [
            non_premium_track_entity,
            premium_track_entity_1,
            premium_track_entity_2,
            premium_track_entity_3,
        ]
        follow_entities = [{"follower_user_id": 2, "followee_user_id": 1}]

        entities = {
            "users": user_entities,
            "tracks": track_entities,
            "follows": follow_entities,
        }

        populate_mock_db(db, entities)

        gated_content_access_checker = GatedContentAccessChecker()

        with db.scoped_session() as session:
            result = gated_content_access_checker.check_access_for_batch(
                session,
                [
                    {
                        "user_id": user_entity_1["user_id"],
                        "premium_content_id": non_exisent_track_id,
                        "premium_content_type": "track",
                    },
                    {
                        "user_id": user_entity_2["user_id"],
                        "premium_content_id": non_premium_track_entity["track_id"],
                        "premium_content_type": "track",
                    },
                    {
                        "user_id": user_entity_2["user_id"],
                        "premium_content_id": premium_track_entity_1["track_id"],
                        "premium_content_type": "track",
                    },
                    {
                        "user_id": user_entity_3["user_id"],
                        "premium_content_id": premium_track_entity_2["track_id"],
                        "premium_content_type": "track",
                    },
                    {
                        "user_id": user_entity_2["user_id"],
                        "premium_content_id": premium_track_entity_3["track_id"],
                        "premium_content_type": "track",
                    },
                ],
            )

            track_access_result = result["track"]

            # test non-existent track
            assert user_entity_1["user_id"] not in track_access_result

            # test non-gated track
            user_2_non_premium_track_access_result = track_access_result[
                user_entity_2["user_id"]
            ][non_premium_track_entity["track_id"]]
            assert (
                not user_2_non_premium_track_access_result["is_premium"]
                and user_2_non_premium_track_access_result["does_user_have_access"]
            )

            # test gated track with user who has no access
            user_2_premium_track_access_result = track_access_result[
                user_entity_2["user_id"]
            ][premium_track_entity_1["track_id"]]
            assert (
                user_2_premium_track_access_result["is_premium"]
                and not user_2_premium_track_access_result["does_user_have_access"]
            )

            # test gated track with user who owns the track
            user_3_premium_track_access_result = track_access_result[
                user_entity_3["user_id"]
            ][premium_track_entity_2["track_id"]]
            assert (
                user_3_premium_track_access_result["is_premium"]
                and user_3_premium_track_access_result["does_user_have_access"]
            )

            # test gated track with user who has access
            user_2_premium_track_access_result_2 = track_access_result[
                user_entity_2["user_id"]
            ][premium_track_entity_3["track_id"]]
            assert (
                user_2_premium_track_access_result_2["is_premium"]
                and user_2_premium_track_access_result_2["does_user_have_access"]
            )
