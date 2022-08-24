from integration_tests.utils import populate_mock_db
from src.premium_content.premium_content_access_checker import (
    PremiumContentAccessChecker,
)
from src.utils.db_session import get_db_read_replica


def test_track_access(app):
    with app.app_context():
        db = get_db_read_replica()

        user_entities = [{"user_id": 1}, {"user_id": 2}]
        non_premium_track_entity = {
            "track_id": 1,
            "is_premium": False,
            "premium_conditions": None,
        }
        premium_track_entity = {
            "track_id": 2,
            "is_premium": True,
            "premium_conditions": {"nft-collection": "some-nft-collection"},
        }
        track_entities = [non_premium_track_entity, premium_track_entity]
        entities = {"users": user_entities, "tracks": track_entities}

        populate_mock_db(db, entities)

        premium_content_access_checker = PremiumContentAccessChecker()

        # test non-existent track
        non_exisent_track_id = 3
        is_premium, does_user_have_access = premium_content_access_checker.check_access(
            user_entities[0]["user_id"], non_exisent_track_id, "track"
        )
        assert not is_premium and does_user_have_access

        # test non-premium track
        is_premium, does_user_have_access = premium_content_access_checker.check_access(
            user_entities[1]["user_id"], non_premium_track_entity["track_id"], "track"
        )
        assert not is_premium and does_user_have_access

        # test premium track with user who has access
        is_premium, does_user_have_access = premium_content_access_checker.check_access(
            user_entities[1]["user_id"], premium_track_entity["track_id"], "track"
        )
        assert is_premium and does_user_have_access

        # todo: test premium track with user who has no access
        # after we implement nft infexing
