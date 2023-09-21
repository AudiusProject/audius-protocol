import logging
from unittest import mock

from src.challenges.challenge_event import ChallengeEvent
from src.models.indexing.indexing_checkpoints import IndexingCheckpoint
from src.tasks.index_profile_challenge_backfill import (
    enqueue_social_rewards_check,
    get_latest_backfill,
    index_profile_challenge_backfill_tablename,
)
from src.utils.db_session import get_db
from src.utils.update_indexing_checkpoints import save_indexed_checkpoint
from tests.utils import populate_mock_db

logger = logging.getLogger(__name__)


@mock.patch(
    "src.tasks.index_profile_challenge_backfill.get_config_backfill", autospec=True
)
@mock.patch("src.challenges.challenge_event_bus.ChallengeEventBus", autospec=True)
def test_index_profile_challenge_backfill(
    bus_mock: mock.MagicMock, get_config_backfill: mock.MagicMock, app
):
    get_config_backfill.return_value = 0
    with app.app_context():
        db = get_db()

        entities = {
            "users": [{}] * 100,
            "reposts": [{"user_id": i, "blocknumber": i + 2} for i in range(1, 50)],
            "saves": [{"user_id": i + 1, "blocknumber": i + 3} for i in range(1, 20)],
            "follows": [
                {
                    "follower_user_id": i + 4,
                    "followee_user_id": i + 4,
                    "blocknumber": i + 7,
                }
                for i in range(1, 60)
            ],
            "tracks": [{"owner_id": i} for i in range(1, 7)],
        }
        populate_mock_db(db, entities)

        enqueue_social_rewards_check(db, bus_mock)
        repost_calls = [
            mock.call.dispatch(ChallengeEvent.repost, i + 2, i) for i in range(1, 50)
        ]
        save_calls = [
            mock.call.dispatch(ChallengeEvent.favorite, i + 3, i + 1)
            for i in range(1, 20)
        ]
        follow_calls = [
            mock.call.dispatch(ChallengeEvent.follow, i + 7, i + 4)
            for i in range(1, 60)
        ]
        calls = repost_calls + save_calls + follow_calls
        bus_mock.assert_has_calls(calls, any_order=True)

    with db.scoped_session() as session:
        checkpoint = (
            session.query(IndexingCheckpoint)
            .filter(
                IndexingCheckpoint.tablename
                == index_profile_challenge_backfill_tablename
            )
            .first()
        )

        assert checkpoint.last_checkpoint == -901


@mock.patch(
    "src.tasks.index_profile_challenge_backfill.get_config_backfill", autospec=True
)
def test_index_profile_challenge_get_blocknumber(
    get_config_backfill: mock.MagicMock, app
):
    get_config_backfill.return_value = 10
    with app.app_context():
        db = get_db()

        # No checkpoint and no block
        with db.scoped_session() as session:
            cp_1 = get_latest_backfill(session, 10)
            assert cp_1 == None

        entities = {"users": [{}] * 100}
        populate_mock_db(db, entities)

        # No checkpoint - so return latest block
        with db.scoped_session() as session:
            cp_2 = get_latest_backfill(session, 10)
            assert cp_2 == 99

            save_indexed_checkpoint(
                session, index_profile_challenge_backfill_tablename, 80
            )

            # with checkpoint greater than backfill stopping blocknumber
            cp_3 = get_latest_backfill(session, 10)
            assert cp_3 == 80

            save_indexed_checkpoint(
                session, index_profile_challenge_backfill_tablename, 7
            )

            # with checkpoint less than backfill stopping blocknumber
            cp_3 = get_latest_backfill(session, 10)
            assert cp_3 == None
