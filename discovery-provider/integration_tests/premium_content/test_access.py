from integration_tests.utils import populate_mock_db
from src.premium_content.premium_content_access_checker import (
    PremiumContentAccessChecker,
)
from src.utils.db_session import get_db_read_replica


def test_track_access(app):
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
            "premium_conditions": {"nft-collection": "some-nft-collection"},
        }
        premium_track_entity_2 = {
            "track_id": 4,
            "owner_id": user_entity_3["user_id"],
            "is_premium": True,
            "premium_conditions": {"nft-collection": "some-nft-collection"},
        }
        track_entities = [
            non_premium_track_entity,
            premium_track_entity_1,
            premium_track_entity_2,
        ]

        entities = {"users": user_entities, "tracks": track_entities}

        populate_mock_db(db, entities)

        premium_content_access_checker = PremiumContentAccessChecker()

        result = premium_content_access_checker.check_access_for_batch(
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
            ]
        )

        track_access_result = result["track"]

        # test non-existent track
        assert user_entity_1["user_id"] not in track_access_result

        # test non-premium track
        user_2_non_premium_track_access_result = track_access_result[
            user_entity_2["user_id"]
        ][non_premium_track_entity["track_id"]]
        assert (
            not user_2_non_premium_track_access_result["is_premium"]
            and user_2_non_premium_track_access_result["does_user_have_access"]
        )

        # test premium track with user who has access
        user_2_premium_track_access_result = track_access_result[
            user_entity_2["user_id"]
        ][premium_track_entity_1["track_id"]]
        assert (
            user_2_premium_track_access_result["is_premium"]
            and user_2_premium_track_access_result["does_user_have_access"]
        )

        # test premium track with user who owns the track
        user_3_premium_track_access_result = track_access_result[
            user_entity_3["user_id"]
        ][premium_track_entity_2["track_id"]]
        assert (
            user_3_premium_track_access_result["is_premium"]
            and user_3_premium_track_access_result["does_user_have_access"]
        )

        # todo: test premium track with user who has no access
        # after we implement nft infexing
